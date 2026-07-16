"use client";

import { useState } from "react";
import Image from "next/image";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label, TextInput } from "@/components/ui/field";

function safeRedirectTarget(): string {
  if (typeof window === "undefined") return "/dashboard";
  const from = new URLSearchParams(window.location.search).get("from");
  // Only allow same-site absolute paths to avoid open-redirect.
  if (from && from.startsWith("/") && !from.startsWith("//")) return from;
  return "/dashboard";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Connexion impossible.");
      }
      // Hard navigation so the workspace provider mounts fresh and loads authenticated data.
      window.location.assign(safeRedirectTarget());
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Connexion impossible.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#FFFDF3] p-4">
      <div className="w-full max-w-sm rounded-lg border border-[#D8E5EC] bg-white p-6 shadow-[0_24px_80px_rgba(24,35,43,0.12)]">
        <div className="mb-5 flex items-center gap-3">
          <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg border-2 border-[#18232B] bg-white">
            <Image src="/logo-jaime-besac.jpeg" alt="Logo J'aime Besac" fill sizes="80px" className="object-cover" priority />
          </div>
          <div>
            <p className="text-sm font-black text-[#18232B]">J&apos;aime Besac</p>
            <p className="text-xs font-bold text-[#596A76]">Espace privé</p>
          </div>
        </div>

        <h1 className="text-lg font-black text-[#18232B]">Connexion</h1>
        <p className="mt-1 text-sm text-[#596A76]">Accès réservé. Identifie-toi pour continuer.</p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="login-email">Email</Label>
            <TextInput
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="login-password">Mot de passe</Label>
            <TextInput
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-[#E8A7B9] bg-[#FDEDF3] px-3 py-2 text-sm font-bold text-[#8A3048]">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            <LogIn className="h-4 w-4" />
            {submitting ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </div>
    </div>
  );
}
