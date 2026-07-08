import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getOrCreateUser } from "@/lib/get-or-create-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!user.stripeCustomerId) {
    return NextResponse.json(
      { error: "No Stripe customer. Subscribe first." },
      { status: 400 }
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://hirecraft-app-git-main-nouris-projects-24b6c9eb.vercel.app";

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
