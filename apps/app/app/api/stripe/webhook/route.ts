import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  const stripe = getStripe();
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Signature error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        await db.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            plan: "pro",
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: sub.status,
            subscriptionRenewsAt: new Date(sub.current_period_end * 1000),
          },
        });
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const isActive = sub.status === "active" || sub.status === "trialing";
        await db.user.updateMany({
          where: { stripeCustomerId: sub.customer as string },
          data: {
            plan: isActive ? "pro" : "free",
            subscriptionStatus: sub.status,
            subscriptionRenewsAt: new Date(sub.current_period_end * 1000),
          },
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await db.user.updateMany({
          where: { stripeCustomerId: sub.customer as string },
          data: {
            plan: "free",
            subscriptionStatus: "canceled",
            stripeSubscriptionId: null,
            subscriptionRenewsAt: null,
          },
        });
        break;
      }
    }
    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
