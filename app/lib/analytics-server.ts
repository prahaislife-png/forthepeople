import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function trackServerEvent(
  eventName: string,
  userId: string | null,
  metadata?: Record<string, unknown>
) {
  try {
    await getSupabaseAdmin().from("analytics_events").insert({
      event_name: eventName,
      user_id: userId,
      metadata: metadata || {},
    });
  } catch {
    // Silent fail — never break payment flows for analytics
  }
}
