"use server";

import { compare } from "bcryptjs";
import { signToken, COOKIE_NAME } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Domain-based auth:
 *  @gadi.ai            → GADI_PASS  (plain text env var)
 *  @gogreenbuilders.com → GGB_PASS  (plain text env var)
 *  exact match          → AUTH_EMAIL + AUTH_PASSWORD (legacy fallback, bcrypt or plain)
 */
function checkDomainPassword(email: string, password: string): boolean | null {
  const lower = email.toLowerCase();
  if (lower.endsWith("@gadi.ai")) {
    const expected = process.env.GADI_PASS ?? "";
    return expected !== "" && password === expected;
  }
  if (lower.endsWith("@gogreenbuilders.com")) {
    const expected = process.env.GGB_PASS ?? "";
    return expected !== "" && password === expected;
  }
  return null; // not a domain user — fall through to legacy
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loginAction(_state: any, formData: FormData) {
  const email    = (formData.get("email")    as string ?? "").trim();
  const password =  formData.get("password") as string ?? "";

  console.log("DEBUG email:", JSON.stringify(email));
  console.log("DEBUG password:", JSON.stringify(password));
  console.log("DEBUG GADI_PASS:", JSON.stringify(process.env.GADI_PASS));

  if (!email || !password) {
    return { error: "Invalid email or password" };
  }

  // ── Domain-based check (plain text comparison) ──────────────
  const domainResult = checkDomainPassword(email, password);

  if (domainResult !== null) {
    if (!domainResult) return { error: "Invalid email or password" };
  } else {
    // ── Legacy single-user fallback ─────────────────────────
    const envEmail = process.env.AUTH_EMAIL ?? "";
    const envHash  = process.env.AUTH_PASSWORD ?? "";
    if (email.toLowerCase() !== envEmail.toLowerCase()) {
      return { error: "Invalid email or password" };
    }
    const valid = envHash.startsWith("$2")
      ? await compare(password, envHash)
      : password === envHash;
    if (!valid) return { error: "Invalid email or password" };
  }

  // Sign JWT and set cookie
  const token = await signToken({ email: email.toLowerCase() });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  redirect("/overview");
}
