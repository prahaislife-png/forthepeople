import { NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe, SERVICE_PLANS, type ServicePlanKey } from "@/app/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { planKey, email } = await request.json() as {
      planKey: ServicePlanKey;
      email?: string;
    };

    const plan = SERVICE_PLANS[planKey];
    if (!plan) {
      return Response.json({ error: "Invalid service plan" }, { status: 400 });
    }

    if (plan.priceId === "price_placeholder") {
      return Response.json({ error: "This service is not yet available. Please check back soon." }, { status: 400 });
    }

    const origin = request.nextUrl.origin;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: [{ price: plan.priceId, quantity: 1 }],
      mode: plan.mode,
      success_url: `${origin}/services/${plan.service}/result?session_id={CHECKOUT_SESSION_ID}&plan=${planKey}`,
      cancel_url: `${origin}/services/${plan.service}?canceled=true`,
      customer_email: email || undefined,
      metadata: { planKey, service: plan.service },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return Response.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
