"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const payload = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      name: String(formData.get("name") ?? ""),
      wantsSeller: formData.get("wantsSeller") === "on",
      displayName: String(formData.get("displayName") ?? ""),
    };

    try {
      if (mode === "register") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Registration failed");
        }
      }

      const result = await signIn("credentials", {
        email: payload.email,
        password: payload.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Invalid credentials");
      }

      router.push(mode === "register" && payload.wantsSeller ? "/seller/dashboard" : "/mypage");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Log in" : "Create account"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          action={async (formData) => {
            await handleSubmit(formData);
          }}
        >
          {mode === "register" ? (
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Taro Creator" />
            </div>
          ) : null}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
          </div>
          {mode === "register" ? (
            <>
              <label className="flex items-center gap-3 rounded-2xl border border-border p-4 text-sm">
                <input name="wantsSeller" type="checkbox" className="h-4 w-4" />
                出品者アカウントとして開始する
              </label>
              <div>
                <Label htmlFor="displayName">Seller display name</Label>
                <Input id="displayName" name="displayName" placeholder="Studio North" />
              </div>
            </>
          ) : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Processing..." : mode === "login" ? "Log in" : "Create account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
