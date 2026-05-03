import { NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe, PLANS, type PlanKey } from "@/app/lib/stripe";
import { trackServerEvent } from "@/app/lib/analytics-server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { planKey, districtId, email } = await request.json() as {
      planKey: PlanKey;
      districtId?: number;
      email?: string;
    };

    const plan = PLANS[planKey];
    if (!plan) {
      return Response.json({ error: "Invalid plan" }, { status: 400 });
    }

    const origin = request.nextUrl.origin;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: [{ price: plan.priceId, quantity: 1 }],
      mode: plan.mode,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&plan=${planKey}`,
      cancel_url: `${origin}/pricing?canceled=true`,
      customer_email: email || undefined,
      metadata: {
        planKey,
        ...(districtId ? { districtId: String(districtId) } : {}),
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    await trackServerEvent("payment_started", null, { planKey, districtId });

    return Response.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
