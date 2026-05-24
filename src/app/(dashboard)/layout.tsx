import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { ShellClient } from "@/components/ShellClient";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) redirect("/login");
  const session = await verifyToken(token);
  if (!session) redirect("/login");

  const isGadiUser = session.email.endsWith("@gadi.ai");

  return (
    <ShellClient email={session.email} isGadiUser={isGadiUser}>
      {children}
    </ShellClient>
  );
}
