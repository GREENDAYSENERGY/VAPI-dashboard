"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import Image from "next/image";

type State = { error?: string } | null;

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loginAction as any,
    null
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#f6f8fb" }}
    >
      {/* Background accent blobs */}
      <div
        aria-hidden
        style={{
          position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0,
        }}
      >
        <div style={{
          position: "absolute", top: "-15%", right: "-10%",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,121,193,0.08) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-10%", left: "-8%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(10,74,115,0.06) 0%, transparent 70%)",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}>

        {/* Card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e8e8e8",
            borderRadius: 16,
            boxShadow: "0 4px 24px rgba(10,74,115,0.09), 0 1px 4px rgba(10,74,115,0.05)",
            overflow: "hidden",
          }}
        >
          {/* Top accent bar */}
          <div style={{ height: 4, background: "linear-gradient(90deg, #0a4a73 0%, #0079c1 100%)" }} />

          <div style={{ padding: "40px 40px 36px" }}>

            {/* Logo + brand */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 60, height: 60, borderRadius: 14,
                  background: "linear-gradient(135deg, #0a4a73 0%, #0079c1 100%)",
                  marginBottom: 16,
                  boxShadow: "0 4px 14px rgba(0,121,193,0.3)",
                }}
              >
                <Image src="/icon-dots-white.svg" alt="Gadi.ai" width={32} height={32} />
              </div>

              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a2530", margin: 0, letterSpacing: "-0.01em" }}>
                Gadi<span style={{ color: "#0079c1", fontWeight: 400 }}>.ai</span>
              </h1>
              <p style={{ fontSize: 13, color: "#737373", marginTop: 6, lineHeight: 1.5 }}>
                Voice AI Agent For Energetic Businesses
              </p>
            </div>

            {/* Form */}
            <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label
                  htmlFor="email"
                  style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#525252", marginBottom: 6 }}
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@gogreen.com"
                  required
                  autoComplete="email"
                  style={{
                    width: "100%",
                    height: 40,
                    padding: "0 12px",
                    border: "1px solid #e8e8e8",
                    borderRadius: 8,
                    fontSize: 14,
                    color: "#1a2530",
                    background: "#fcfcfc",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = "#0079c1";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,121,193,0.15)";
                    e.currentTarget.style.background = "#fff";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = "#e8e8e8";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.background = "#fcfcfc";
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#525252", marginBottom: 6 }}
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{
                    width: "100%",
                    height: 40,
                    padding: "0 12px",
                    border: "1px solid #e8e8e8",
                    borderRadius: 8,
                    fontSize: 14,
                    color: "#1a2530",
                    background: "#fcfcfc",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = "#0079c1";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,121,193,0.15)";
                    e.currentTarget.style.background = "#fff";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = "#e8e8e8";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.background = "#fcfcfc";
                  }}
                />
              </div>

              {state?.error && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "#fbe9e9",
                    border: "1px solid #f5c6c6",
                    fontSize: 13,
                    color: "#dc2626",
                  }}
                >
                  {state.error}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                style={{
                  width: "100%",
                  height: 42,
                  borderRadius: 8,
                  border: "none",
                  background: isPending
                    ? "#6aadcf"
                    : "linear-gradient(135deg, #0a4a73 0%, #0079c1 100%)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isPending ? "not-allowed" : "pointer",
                  letterSpacing: "0.01em",
                  fontFamily: "inherit",
                  transition: "opacity 0.15s",
                  marginTop: 4,
                }}
                onMouseEnter={e => { if (!isPending) e.currentTarget.style.opacity = "0.88"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
              >
                {isPending ? "Signing in…" : "Sign in"}
              </button>
            </form>

          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#a3a3a3" }}>
          Powered by{" "}
          <span style={{ color: "#0079c1", fontWeight: 500 }}>Gadi.ai</span>
        </p>

      </div>
    </div>
  );
}
