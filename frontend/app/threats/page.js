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
        <ul className="space-y-3">
          {threats.length === 0 ? (
            <p className="text-center text-slate-500 py-4 text-sm">No threat events detected.</p>
          ) : (
            threats.map((t) => {
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

              let severityBadge = "bg-slate-500/10 text-slate-400 border border-slate-500/20";
              if (t.severity === "CRITICAL") severityBadge = "bg-red-500/10 text-red-400 border border-red-500/30 font-bold shadow-[0_0_10px_rgba(239,68,68,0.1)]";
              else if (t.severity === "HIGH") severityBadge = "bg-orange-500/10 text-orange-400 border border-orange-500/30 font-bold shadow-[0_0_10px_rgba(249,115,22,0.1)]";
              else if (t.severity === "MEDIUM") severityBadge = "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 font-bold";
              else if (t.severity === "LOW") severityBadge = "bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold";

              const confidencePercentage = Math.round((t.confidence || 0) * 100);

              return (
                <li key={t.id} className="rounded-xl border border-white/10 bg-black/10 hover:border-orange-500/30 p-4 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(249,115,22,0.05)]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-lg px-2.5 py-1 text-xs uppercase tracking-wider font-semibold ${severityBadge}`}>
                        {t.severity}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white tracking-wide">{t.type}</h4>
                        <p className="text-[10px] text-slate-500 uppercase mt-0.5 font-mono">ID: {t.id.slice(0, 8)}...</p>
                      </div>
                    </div>

                    <div className="flex-1 max-w-xs">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                        <span className="uppercase tracking-wider font-semibold">AI Model Confidence</span>
                        <span className="font-bold text-orange-400 font-mono">{confidencePercentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${confidencePercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {alert ? (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[10px] text-slate-500 font-mono">ALERT: {alert.id.slice(0, 8)}...</span>
                          {incidentExists ? (
                            <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 font-bold text-emerald-400 text-[10px] uppercase tracking-wider">
                              Incident: {alert.incident.status}
                            </span>
                          ) : (
                            <Link href={`/incidents?alertId=${alert.id}`} className="rounded-lg bg-orange-500 px-3 py-1.5 font-bold text-black text-[10px] uppercase tracking-wider hover:bg-orange-400 transition-colors">
                              Create Incident
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => openCopilotWithAlert(alertPrompt)}
                            className="rounded-lg border border-orange-400/40 px-3 py-1.5 font-bold text-orange-200 text-[10px] uppercase tracking-wider hover:bg-orange-500/10 transition-colors"
                          >
                            Ask Copilot
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">No linked alert</span>
                          <button
                            type="button"
                            onClick={() => openCopilotWithAlert(alertPrompt)}
                            className="rounded-lg border border-orange-400/40 px-3 py-1.5 font-bold text-orange-200 text-[10px] uppercase tracking-wider hover:bg-orange-500/10 transition-colors"
                          >
                            Ask Copilot
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </AppShell>
  );
}
