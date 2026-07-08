import { NextRequest, NextResponse } from "next/server";
import { getStripe, proPriceId } from "@/lib/stripe";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/get-or-create-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const priceId = proPriceId();
  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe price not configured. Set STRIPE_PRICE_PRO_MONTHLY." },
      { status: 500 }
    );
  }

  const stripe = getStripe();

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.displayName ?? undefined,
      metadata: { userId: user.id, clerkId: user.clerkId },
    });
    customerId = customer.id;
    await db.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://hirecraft-app-git-main-nouris-projects-24b6c9eb.vercel.app";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancel`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { userId: user.id },
    },
  });

  return NextResponse.json({ url: session.url });
}
