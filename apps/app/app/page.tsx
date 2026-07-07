import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs";

export default function AppRoot() {
  const { userId } = auth();
  if (userId) redirect("/dashboard");
  redirect("/sign-in");
}
