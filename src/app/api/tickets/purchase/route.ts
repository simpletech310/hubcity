import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getStripe,
  generateOrderNumber,
  calculatePlatformFee,
} from "@/lib/stripe";
import { isTicketSalesOpen } from "@/lib/tickets";
import type { EventTicketConfig } from "@/types/database";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { event_id, items } = await request.json();

    if (!event_id || !items || !items.length) {
      return NextResponse.json(
        { error: "event_id and items are required" },
        { status: 400 }
      );
    }

    // Fetch event and validate
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!event.is_ticketed) {
      return NextResponse.json(
        { error: "Event is not ticketed" },
        { status: 400 }
      );
    }

    if (!isTicketSalesOpen(event)) {
      return NextResponse.json(
        { error: "Ticket sales are not open" },
        { status: 400 }
      );
    }

    // Validate total tickets per person
    const totalTickets = items.reduce(
      (sum: number, item: { quantity: number }) => sum + item.quantity,
      0
    );

    if (totalTickets > event.max_tickets_per_person) {
      return NextResponse.json(
        {
          error: `Maximum ${event.max_tickets_per_person} tickets per person`,
        },
        { status: 400 }
      );
    }

    // Fetch all requested configs
    const configIds = items.map(
      (item: { config_id: string }) => item.config_id
    );
    const { data: configs, error: configsError } = await supabase
      .from("event_ticket_config")
      .select("*")
      .in("id", configIds)
      .eq("event_id", event_id)
      .eq("is_active", true);

    if (configsError || !configs || configs.length !== configIds.length) {
      return NextResponse.json(
        { error: "Invalid ticket configuration" },
        { status: 400 }
      );
    }

    const configMap = new Map<string, EventTicketConfig>(
      configs.map((c: EventTicketConfig) => [c.id, c])
    );

    // Validate each item
    for (const item of items as { config_id: string; quantity: number }[]) {
      const config = configMap.get(item.config_id);
      if (!config) {
        return NextResponse.json(
          { error: "Invalid ticket configuration" },
          { status: 400 }
        );
      }
      if (item.quantity <= 0) {
        return NextResponse.json(
          { error: "Quantity must be greater than 0" },
          { status: 400 }
        );
      }
      if (item.quantity > config.max_per_order) {
        return NextResponse.json(
          { error: `Maximum ${config.max_per_order} tickets for ${config.venue_section?.name || "this section"}` },
          { status: 400 }
        );
      }
      if (item.quantity > config.available_count) {
        return NextResponse.json(
          { error: "Not enough tickets available" },
          { status: 409 }
        );
      }
    }

    // Reserve tickets with optimistic concurrency
    const reserved: { config_id: string; quantity: number }[] = [];

    for (const item of items as { config_id: string; quantity: number }[]) {
      const config = configMap.get(item.config_id)!;

      const { data: updated, error: updateError } = await supabase
        .from("event_ticket_config")
        .update({ available_count: config.available_count - item.quantity })
        .eq("id", item.config_id)
        .eq("available_count", config.available_count)
        .select("id")
        .single();

      if (updateError || !updated) {
        // Rollback previously reserved
        for (const prev of reserved) {
          const prevConfig = configMap.get(prev.config_id)!;
          await supabase
            .from("event_ticket_config")
            .update({
              available_count: prevConfig.available_count,
            })
            .eq("id", prev.config_id);
        }
        return NextResponse.json(
          { error: "Tickets no longer available — please try again" },
          { status: 409 }
        );
      }

      reserved.push({
        config_id: item.config_id,
        quantity: item.quantity,
      });
    }

    // Calculate totals
    let subtotal = 0;
    for (const item of items as { config_id: string; quantity: number }[]) {
      const config = configMap.get(item.config_id)!;
      subtotal += config.price * item.quantity;
    }
    const platform_fee = calculatePlatformFee(subtotal);
    const total = subtotal + platform_fee;
    const order_number = generateOrderNumber();

    // Fetch venue section names for order items
    const sectionIds = configs.map(
      (c: EventTicketConfig) => c.venue_section_id
    );
    const { data: sections } = await supabase
      .from("venue_sections")
      .select("id, name")
      .in("id", sectionIds);

    const sectionNameMap = new Map(
      (sections || []).map((s: { id: string; name: string }) => [s.id, s.name])
    );

    // Create ticket_order
    const { data: order, error: orderError } = await supabase
      .from("ticket_orders")
      .insert({
        order_number,
        event_id,
        customer_id: user.id,
        status: "pending",
        subtotal,
        platform_fee,
        total,
        customer_email: user.email || null,
        customer_name:
          user.user_metadata?.display_name ||
          user.user_metadata?.full_name ||
          null,
      })
      .select("*")
      .single();

    if (orderError) throw orderError;

    // Create ticket_order_items
    const orderItems = (
      items as { config_id: string; quantity: number }[]
    ).map((item) => {
      const config = configMap.get(item.config_id)!;
      return {
        order_id: order.id,
        event_ticket_config_id: item.config_id,
        section_name:
          sectionNameMap.get(config.venue_section_id) || "General",
        price: config.price,
        quantity: item.quantity,
      };
    });

    const { error: itemsError } = await supabase
      .from("ticket_order_items")
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Create Stripe PaymentIntent (city event — no transfer_data)
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: "usd",
      metadata: {
        ticket_order_id: order.id,
        event_id,
        user_id: user.id,
      },
    });

    // Update order with Stripe PI id
    await supabase
      .from("ticket_orders")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("id", order.id);

    return NextResponse.json({
      order_id: order.id,
      order_number,
      client_secret: paymentIntent.client_secret,
      total,
    });
  } catch (error) {
    console.error("Ticket purchase error:", error);
    return NextResponse.json(
      { error: "Failed to create ticket order" },
      { status: 500 }
    );
  }
}
