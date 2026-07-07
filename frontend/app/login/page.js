"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../../components/AuthShell";
import api from "../../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFaCode, setTwoFaCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const { data } = await api.post("/auth/login", {
        email: email.trim(),
        password,
        twoFaCode: twoFaCode.trim() || undefined
      });
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      router.push("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid credentials");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access your SOC console"
      footerText="New to CyberGuard?"
      footerLink="Create account"
      footerHref="/register"
      rightTitle="Unified Detection + Response"
      rightBody="Monitor threats, triage incidents, and coordinate analyst response from one workspace."
    >
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-xs uppercase tracking-[0.12em] text-slate-400">Work Email</label>
        <input
          className="w-full rounded-lg bg-black/20 p-3"
          type="email"
          autoComplete="email"
          placeholder="admin@cyber.local"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="block text-xs uppercase tracking-[0.12em] text-slate-400">Password</label>
        <input
          className="w-full rounded-lg bg-black/20 p-3"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label className="block text-xs uppercase tracking-[0.12em] text-slate-400">2FA Code (Optional)</label>
        <input
          className="w-full rounded-lg bg-black/20 p-3"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          value={twoFaCode}
          onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ""))}
        />

        {error && <p className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        <button
          disabled={isSubmitting}
          className="w-full rounded-lg bg-orange-500 p-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
