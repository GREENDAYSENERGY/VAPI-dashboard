"use server";

import { compare } from "bcryptjs";
import { signToken, COOKIE_NAME } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loginAction(_state: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const envEmail = process.env.AUTH_EMAIL ?? "";
  const envHash = process.env.AUTH_PASSWORD ?? "";

  // Validate email
  if (!email || email.trim().toLowerCase() !== envEmail.toLowerCase()) {
    return { error: "Invalid email or password" };
  }

  // Validate password against bcrypt hash
  const valid = await compare(password, envHash);
  if (!valid) {
    return { error: "Invalid email or password" };
  }

  // Sign JWT and set cookie
  const token = await signToken({ email });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  redirect("/dashboard");
}
