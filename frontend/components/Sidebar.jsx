"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getCurrentRole } from "../lib/auth";

const links = [
  ["Dashboard", "/dashboard"],
  ["Search", "/search"],
  ["Logs", "/logs"],
  ["Threats", "/threats"],
  ["Incidents", "/incidents"],
  ["Reports", "/reports"],
  ["Admin", "/admin", "ADMIN"]
];

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const pathname = usePathname();
  const [role, setRole] = useState(null);

  useEffect(() => {
    setRole(getCurrentRole());
  }, [pathname]);

  const visibleLinks = useMemo(
    () => links.filter(([, , requiredRole]) => !requiredRole || requiredRole === role),
    [role]
  );

  return (
    <aside
      className={`glass z-40 border-r p-4 fixed inset-y-0 left-0 h-screen w-72 overflow-y-auto transition-transform duration-200 ease-out lg:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      } lg:left-0 lg:w-72`}
    >
      <div className="mb-6 flex items-start justify-between border-b border-white/10 pb-4">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-orange-300">CyberGuard SIEM</div>
          <h2 className="mt-1 text-lg font-semibold">Security Operations</h2>
          {role && <div className="mt-2 text-xs text-slate-400">Mode: {role === "ADMIN" ? "Admin" : "Analyst"}</div>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-white/20 px-2 py-1 text-xs text-slate-300 lg:hidden"
          aria-label="Close navigation menu"
        >
          Close
        </button>
      </div>

      <nav className="space-y-1">
        {visibleLinks.map(([label, href]) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`relative block rounded px-3 py-2 text-sm ${
                active ? "bg-orange-500/20 text-orange-300" : "text-slate-200 hover:bg-white/5"
              }`}
            >
              {active && <span className="absolute left-0 top-0 h-full w-1 rounded-r bg-orange-400" />}
              <span className="ml-1">{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
