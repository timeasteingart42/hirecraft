import { auth, currentUser } from "@clerk/nextjs";
import { db } from "./db";

export async function getOrCreateUser() {
  const { userId: clerkId } = auth();
  if (!clerkId) return null;

  let user = await db.user.findUnique({ where: { clerkId } });
  if (user) return user;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  user = await db.user.create({
    data: {
      clerkId,
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      displayName: clerkUser.firstName
        ? `${clerkUser.firstName} ${clerkUser.lastName ?? ""}`.trim()
        : null,
    },
  });

  return user;
}
