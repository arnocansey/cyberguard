"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import api from "../../lib/api";

const openCopilotWithAlert = (prompt) => {
  window.dispatchEvent(
    new CustomEvent("soc-copilot:ask", {
      detail: { prompt, autoSend: true }
    })
  );
};

export default function ThreatsPage() {
  const [threats, setThreats] = useState([]);

  useEffect(() => {
    api.get("/threats").then((r) => setThreats(r.data));
  }, []);

  return (
    <AppShell title="Threat Monitoring">
      <div className="glass rounded-xl p-4">
        <ul className="space-y-2">
          {threats.map((t) => {
            const alert = t.alerts?.[0];
            const incidentExists = Boolean(alert?.incident?.id);
            const alertPrompt = [
              "Help me triage this threat and propose next actions:",
              `Threat: ${t.type}`,
              `Severity: ${t.severity}`,
              `Confidence: ${Math.round((t.confidence || 0) * 100)}%`,
              `Alert ID: ${alert?.id || "N/A"}`,
              `Current status: ${alert?.status || "NEW"}`
            ].join("\n");

            return (
              <li key={t.id} className="rounded border border-white/10 p-2">
                <div className="mb-2 text-sm">
                  {t.type} | {t.severity} | confidence {Math.round(t.confidence * 100)}%
                </div>
                {alert ? (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400">Alert: {alert.id.slice(0, 8)}...</span>
                    {incidentExists ? (
                      <span className="rounded bg-white/10 px-2 py-1">Incident: {alert.incident.status}</span>
                    ) : (
                      <Link href={`/incidents?alertId=${alert.id}`} className="rounded bg-orange-500 px-2 py-1 font-semibold text-black">
                        Open in incidents
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => openCopilotWithAlert(alertPrompt)}
                      className="rounded border border-orange-400/60 px-2 py-1 text-orange-200"
                    >
                      Ask Copilot
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-400">No linked alert found.</span>
                    <button
                      type="button"
                      onClick={() => openCopilotWithAlert(alertPrompt)}
                      className="rounded border border-orange-400/60 px-2 py-1 text-xs text-orange-200"
                    >
                      Ask Copilot
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </AppShell>
  );
}
