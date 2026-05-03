import { createClient } from "@/app/lib/supabase-browser";

export type AnalyticsEvent =
  | "page_view"
  | "district_selected"
  | "sign_in"
  | "sign_out"
  | "report_cta_clicked"
  | "payment_started"
  | "payment_completed"
  | "report_viewed";

export async function trackEvent(
  eventName: AnalyticsEvent,
  metadata?: Record<string, unknown>
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("analytics_events").insert({
      event_name: eventName,
      user_id: user?.id || null,
      metadata: metadata || {},
    });
  } catch {
    // Silent fail — never break UX for analytics
  }
}
