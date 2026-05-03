import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-04-22.dahlia",
      typescript: true,
    });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const PLANS = {
  single_report: {
    name: "Single Report",
    price: 799,
    originalPrice: 1140,
    get priceId() { return process.env.STRIPE_PRICE_SINGLE!; },
    mode: "payment" as const,
  },
  explorer: {
    name: "Explorer",
    price: 1500,
    get priceId() { return process.env.STRIPE_PRICE_EXPLORER!; },
    mode: "subscription" as const,
  },
  pro: {
    name: "Pro",
    price: 2500,
    get priceId() { return process.env.STRIPE_PRICE_PRO!; },
    mode: "subscription" as const,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export const SERVICE_PLANS = {
  price_check_basic: {
    name: "Price Check — Basic",
    price: 299,
    get priceId() { return process.env.STRIPE_PRICE_CHECK_BASIC || "price_placeholder"; },
    mode: "payment" as const,
    service: "price-check" as const,
  },
  price_check_premium: {
    name: "Price Check — Premium",
    price: 499,
    get priceId() { return process.env.STRIPE_PRICE_CHECK_PREMIUM || "price_placeholder"; },
    mode: "payment" as const,
    service: "price-check" as const,
  },
  investment_standard: {
    name: "Investment Report — Standard",
    price: 2500,
    get priceId() { return process.env.STRIPE_PRICE_INVESTMENT_STD || "price_placeholder"; },
    mode: "payment" as const,
    service: "investment" as const,
  },
  investment_premium: {
    name: "Investment Report — Premium",
    price: 5000,
    get priceId() { return process.env.STRIPE_PRICE_INVESTMENT_PRO || "price_placeholder"; },
    mode: "payment" as const,
    service: "investment" as const,
  },
  market_basic: {
    name: "Market Updates — Basic",
    price: 499,
    get priceId() { return process.env.STRIPE_PRICE_MARKET_BASIC || "price_placeholder"; },
    mode: "subscription" as const,
    service: "market-updates" as const,
  },
  market_pro: {
    name: "Market Updates — Pro",
    price: 999,
    get priceId() { return process.env.STRIPE_PRICE_MARKET_PRO || "price_placeholder"; },
    mode: "subscription" as const,
    service: "market-updates" as const,
  },
  market_enterprise: {
    name: "Market Updates — Enterprise",
    price: 1500,
    get priceId() { return process.env.STRIPE_PRICE_MARKET_ENT || "price_placeholder"; },
    mode: "subscription" as const,
    service: "market-updates" as const,
  },
} as const;

export type ServicePlanKey = keyof typeof SERVICE_PLANS;
