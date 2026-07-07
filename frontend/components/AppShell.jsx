"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import SocChatbot from "./SocChatbot";
import ThemeToggle from "./ThemeToggle";
import api from "../lib/api";
import { getCurrentRole } from "../lib/auth";

const rangeToFromIso = (range) => {
  const now = Date.now();
  const map = {
    "15m": 15 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000
  };
  const delta = map[range] || map["24h"];
  return new Date(now - delta).toISOString();
};

export default function AppShell({ title, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [range, setRange] = useState("24h");
  const [role, setRole] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setQuery(searchParams.get("q") || searchParams.get("query") || "");
    setRange(searchParams.get("range") || "24h");
    setRole(getCurrentRole());
  }, [searchParams, pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const onRunSearch = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    params.set("range", range);
    params.set("from", rangeToFromIso(range));
    router.push(`/search?${params.toString()}`);
  };

  const showSearchBar = useMemo(() => !["/login", "/register"].includes(pathname), [pathname]);

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) await api.post("/auth/logout", { refreshToken });
    } catch {
      // continue local logout even if API fails
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen">
      <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      <main className="p-5 lg:ml-72 lg:p-6">
        <div className="glass mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="rounded border border-white/20 px-2 py-1 text-slate-200 lg:hidden"
              aria-label="Toggle navigation menu"
            >
              <span className="block h-0.5 w-5 bg-current" />
              <span className="mt-1 block h-0.5 w-5 bg-current" />
              <span className="mt-1 block h-0.5 w-5 bg-current" />
            </button>
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-slate-400">SOC Workspace</div>
              <h1 className="text-2xl font-semibold">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="soc-badge rounded px-2 py-1 text-xs font-medium">Live Monitoring</span>
            {role && <span className="rounded bg-white/10 px-2 py-1 text-xs">Role: {role}</span>}
            <ThemeToggle />
            <button onClick={logout} className="rounded border border-red-500/40 bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-200">
              Logout
            </button>
          </div>
        </div>

        {showSearchBar && (
          <div className="glass mb-4 flex flex-wrap items-center gap-2 rounded-lg p-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-[300px] flex-1 rounded bg-black/20 p-2 text-sm"
              placeholder="Search: source=apache status>=400 path=/login"
            />
            <select value={range} onChange={(e) => setRange(e.target.value)} className="rounded bg-black/20 p-2 text-sm">
              <option value="15m">Last 15m</option>
              <option value="1h">Last 1h</option>
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7d</option>
            </select>
            <button onClick={onRunSearch} className="rounded bg-orange-500 px-3 py-2 text-sm font-semibold text-black">
              Run Search
            </button>
          </div>
        )}

        {children}
      </main>

      <SocChatbot />
    </div>
  );
}
