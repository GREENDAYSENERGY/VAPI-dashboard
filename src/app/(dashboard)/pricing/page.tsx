import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PricingContent from "./PricingContent";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const session = await getSession();

  // Big Brain is only available to gadi.ai team members
  if (!session || !session.email.endsWith("@gadi.ai")) {
    redirect("/dashboard");
  }

  return <PricingContent />;
}
