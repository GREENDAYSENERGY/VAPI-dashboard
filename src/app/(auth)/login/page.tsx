"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type State = { error?: string } | null;

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loginAction as any,
    null
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ backgroundColor: "#166534" }}>
            ☀️
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Go Green Builders</h1>
          <p className="text-gray-500 text-sm mt-1">VAPI Call Dashboard</p>
        </CardHeader>
        <CardContent className="pt-4">
          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                name="email"
                placeholder="admin@gogreen.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                type="password"
                name="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {state?.error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {state.error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
              style={{ backgroundColor: "#166534" }}
            >
              {isPending ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
