import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia" as any,
  typescript: true,
});

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
    stripePriceId: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function planFor(planId: string | null | undefined) {
  return PLANS[(planId as PlanId) || "free"] ?? PLANS.free;
}
