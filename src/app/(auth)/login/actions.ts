"use server";

import { compare } from "bcryptjs";
import { signToken, COOKIE_NAME } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Domain-based auth rules (checked in order):
 *  @gadi.ai            → GADI_PASSWORD
 *  @gogreenbuilders.com → GGB_PASSWORD
 *  exact match          → AUTH_EMAIL + AUTH_PASSWORD (legacy fallback)
 */
function getDomainHash(email: string): string | null {
  const lower = email.toLowerCase();
  if (lower.endsWith("@gadi.ai"))              return process.env.GADI_PASSWORD ?? null;
  if (lower.endsWith("@gogreenbuilders.com"))  return process.env.GGB_PASSWORD  ?? null;
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loginAction(_state: any, formData: FormData) {
  const email    = (formData.get("email")    as string ?? "").trim();
  const password =  formData.get("password") as string ?? "";

  if (!email || !password) {
    return { error: "Invalid email or password" };
  }

  let valid = false;

  // ── Domain-based check ──────────────────────────────────────
  const domainHash = getDomainHash(email);
  if (domainHash) {
    valid = await compare(password, domainHash);
  } else {
    // ── Legacy single-user fallback ─────────────────────────
    const envEmail = process.env.AUTH_EMAIL ?? "";
    const envHash  = process.env.AUTH_PASSWORD ?? "";
    if (email.toLowerCase() !== envEmail.toLowerCase()) {
      return { error: "Invalid email or password" };
    }
    valid = envHash.startsWith("$2")
      ? await compare(password, envHash)
      : password === envHash;
  }

  if (!valid) {
    return { error: "Invalid email or password" };
  }

  // Sign JWT and set cookie
  const token = await signToken({ email: email.toLowerCase() });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  redirect("/overview");
}
