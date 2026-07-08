import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  _stripe = new Stripe(key, {
    apiVersion: "2024-12-18.acacia" as any,
    typescript: true,
  });
  return _stripe;
}

export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    monthlyAiCalls: 3,
    features: [
      "3 job match analyses / month",
      "3 cover letters / month",
      "Application tracker",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 19,
    monthlyAiCalls: null,
    features: [
      "Unlimited job match analyses",
      "Unlimited cover letters",
      "All application tools",
      "Priority support",
    ],
  },
} as const;

export function proPriceId() {
  return process.env.STRIPE_PRICE_PRO_MONTHLY || "";
}

export type PlanId = keyof typeof PLANS;

export function planFor(planId: string | null | undefined) {
  return PLANS[(planId as PlanId) || "free"] ?? PLANS.free;
}
