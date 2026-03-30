import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import type { Message } from "@/types/database";
import MessageThreads from "./MessageThreads";

export default async function DashboardMessagesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!business) return null;

  // Get all messages for this business
  const { data: messages } = await supabase
    .from("messages")
    .select(
      "*, sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url)"
    )
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  const allMessages = (messages ?? []) as (Message & {
    sender: { id: string; display_name: string; avatar_url: string | null } | null;
  })[];

  // Group messages by customer (sender or recipient who isn't the owner)
  const threads: Record<
    string,
    {
      customerId: string;
      customerName: string;
      customerAvatar: string | null;
      lastMessage: string;
      lastAt: string;
      unread: number;
    }
  > = {};

  allMessages.forEach((msg) => {
    const customerId =
      msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
    const customerName =
      msg.sender_id !== user.id
        ? msg.sender?.display_name || "Customer"
        : "Customer";
    const customerAvatar =
      msg.sender_id !== user.id ? msg.sender?.avatar_url || null : null;

    if (!threads[customerId]) {
      threads[customerId] = {
        customerId,
        customerName,
        customerAvatar,
        lastMessage: msg.body,
        lastAt: msg.created_at,
        unread: 0,
      };
    }

    if (!msg.is_read && msg.recipient_id === user.id) {
      threads[customerId].unread++;
    }
  });

  const threadList = Object.values(threads).sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
  );

  return (
    <div className="px-4 py-5 space-y-4">
      <h1 className="font-heading text-xl font-bold">Messages</h1>

      {threadList.length === 0 ? (
        <Card className="text-center py-10">
          <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gold">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm font-medium mb-1">No messages yet</p>
          <p className="text-xs text-txt-secondary">
            Customer messages will appear here
          </p>
        </Card>
      ) : (
        <MessageThreads
          threads={threadList}
          businessId={business.id}
          ownerId={user.id}
        />
      )}
    </div>
  );
}
