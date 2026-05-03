import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = ["prahaislife@gmail.com"];

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user || !ADMIN_EMAILS.includes(user.email || "")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    { count: totalPageViews },
    { data: uniqueVisitors },
    { count: paidUsers },
    { count: reportPurchases },
    { data: recentActivity },
    { data: districtEvents },
    { data: dailyRaw },
    { count: totalSignIns },
  ] = await Promise.all([
    supabase.from("analytics_events").select("*", { count: "exact", head: true }).eq("event_name", "page_view"),
    supabase.from("analytics_events").select("user_id").not("user_id", "is", null),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).neq("plan", "free").eq("status", "active"),
    supabase.from("report_access").select("*", { count: "exact", head: true }),
    supabase.from("analytics_events").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("analytics_events").select("metadata").eq("event_name", "district_selected"),
    supabase.from("analytics_events").select("created_at").eq("event_name", "page_view").gte("created_at", thirtyDaysAgo.toISOString()),
    supabase.from("analytics_events").select("*", { count: "exact", head: true }).eq("event_name", "sign_in"),
  ]);

  const uniqueUserIds = new Set((uniqueVisitors || []).map(v => v.user_id).filter(Boolean));

  const districtViews: Record<number, number> = {};
  (districtEvents || []).forEach((e) => {
    const did = (e.metadata as Record<string, unknown>)?.districtId;
    if (typeof did === "number") {
      districtViews[did] = (districtViews[did] || 0) + 1;
    }
  });

  const dailyViewCounts: Record<string, number> = {};
  (dailyRaw || []).forEach((e) => {
    const day = (e.created_at as string).slice(0, 10);
    dailyViewCounts[day] = (dailyViewCounts[day] || 0) + 1;
  });

  const dailyViews = Object.entries(dailyViewCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, views]) => ({ date, views }));

  return Response.json({
    totalPageViews: totalPageViews || 0,
    uniqueVisitors: uniqueUserIds.size,
    paidUsers: paidUsers || 0,
    reportPurchases: reportPurchases || 0,
    totalSignIns: totalSignIns || 0,
    districtViews,
    dailyViews,
    recentActivity: (recentActivity || []).map((e) => ({
      id: e.id,
      event: e.event_name,
      userId: e.user_id,
      metadata: e.metadata,
      createdAt: e.created_at,
    })),
  });
}
