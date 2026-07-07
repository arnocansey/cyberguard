"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../../components/AuthShell";
import api from "../../lib/api";
import { useToast } from "../../context/ToastContext";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password) {
      setError("Full name, email, and password are required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await api.post("/auth/register", {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role: "SECURITY_ANALYST"
      });
      toast.success("Account created successfully! Please sign in.");
      router.push("/login");
    } catch (err) {
      const msg = err?.response?.data?.message || "Registration failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="Provision your analyst access"
      footerText="Already have an account?"
      footerLink="Sign in"
      footerHref="/login"
      rightTitle="Start SecOps Fast"
      rightBody="Set up your account and move directly into dashboards, events explorer, and incident workflows."
    >
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-xs uppercase tracking-[0.12em] text-slate-400">Full Name</label>
        <input
          className="w-full rounded-lg bg-black/20 p-3"
          placeholder="Jane Analyst"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <label className="block text-xs uppercase tracking-[0.12em] text-slate-400">Work Email</label>
        <input
          className="w-full rounded-lg bg-black/20 p-3"
          type="email"
          autoComplete="email"
          placeholder="jane@cyber.local"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="block text-xs uppercase tracking-[0.12em] text-slate-400">Password</label>
        <input
          className="w-full rounded-lg bg-black/20 p-3"
          type="password"
          autoComplete="new-password"
          placeholder="Minimum 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label className="block text-xs uppercase tracking-[0.12em] text-slate-400">Confirm Password</label>
        <input
          className="w-full rounded-lg bg-black/20 p-3"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <p className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        <button
          disabled={isSubmitting}
          className="w-full rounded-lg bg-orange-500 p-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
