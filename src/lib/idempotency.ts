import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export const IDEMPOTENCY_HEADER = "idempotency-key";

export type CachedPaymentIntent = {
  idempotency_key: string;
  user_id: string;
  resource_type: "booking" | "order" | "ticket";
  resource_id: string | null;
  stripe_payment_intent_id: string;
  amount_cents: number;
  currency: string;
  client_secret: string | null;
  created_at: string;
};

export function readIdempotencyKey(request: Request): {
  key: string;
  clientProvided: boolean;
} {
  const headerKey = request.headers.get(IDEMPOTENCY_HEADER);
  if (headerKey && headerKey.trim().length > 0) {
    return { key: headerKey.trim(), clientProvided: true };
  }
  return { key: randomUUID(), clientProvided: false };
}

export async function findCachedIntent(
  supabase: SupabaseClient,
  userId: string,
  idempotencyKey: string
): Promise<CachedPaymentIntent | null> {
  const { data, error } = await supabase
    .from("payment_intents")
    .select(
      "idempotency_key,user_id,resource_type,resource_id,stripe_payment_intent_id,amount_cents,currency,client_secret,created_at"
    )
    .eq("user_id", userId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (error) return null;
  return (data as CachedPaymentIntent) ?? null;
}

export async function cacheIntent(
  supabase: SupabaseClient,
  row: Omit<CachedPaymentIntent, "created_at">
): Promise<void> {
  await supabase.from("payment_intents").upsert(
    {
      idempotency_key: row.idempotency_key,
      user_id: row.user_id,
      resource_type: row.resource_type,
      resource_id: row.resource_id,
      stripe_payment_intent_id: row.stripe_payment_intent_id,
      amount_cents: row.amount_cents,
      currency: row.currency,
      client_secret: row.client_secret,
    },
    { onConflict: "user_id,idempotency_key" }
  );
}
