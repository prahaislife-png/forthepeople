import { NextRequest } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { trackServerEvent } from "@/app/lib/analytics-server";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return Response.json({ error: message }, { status: 400 });
  }

  if (!relevantEvents.has(event.type)) {
    return Response.json({ received: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const planKey = session.metadata?.planKey;
    const districtId = session.metadata?.districtId;

    if (!userId || !planKey) {
      return Response.json({ error: "Missing metadata" }, { status: 400 });
    }

    if (planKey === "single_report" && districtId) {
      await getSupabaseAdmin().from("report_access").upsert({
        user_id: userId,
        district_id: parseInt(districtId),
      }, { onConflict: "user_id,district_id" });

      await getSupabaseAdmin().from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        plan: "single",
        status: "active",
      }, { onConflict: "user_id" });
    } else {
      const subscriptionId = session.subscription as string;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as Record<string, unknown>;

      await getSupabaseAdmin().from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscriptionId,
        plan: planKey === "explorer" ? "explorer" : "pro",
        status: "active",
        current_period_end: new Date(((subscription.current_period_end as number) || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
      }, { onConflict: "user_id" });
    }

    await trackServerEvent("payment_completed", userId, { planKey, districtId });
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as unknown as Record<string, unknown>;
    const customerId = subscription.customer as string;

    const { data: sub } = await getSupabaseAdmin()
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (sub) {
      await getSupabaseAdmin().from("subscriptions").update({
        status: (subscription.status as string) === "active" ? "active" : "past_due",
        current_period_end: new Date(((subscription.current_period_end as number) || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
      }).eq("user_id", sub.user_id);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as unknown as Record<string, unknown>;
    const customerId = subscription.customer as string;

    await getSupabaseAdmin()
      .from("subscriptions")
      .update({ status: "canceled", plan: "free" })
      .eq("stripe_customer_id", customerId);
  }

  return Response.json({ received: true });
}
