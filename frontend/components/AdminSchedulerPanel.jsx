"use client";

import { useEffect, useMemo, useState } from "react";
import api from "../lib/api";

const TASK_BUTTONS = [
  { key: "search_jobs", label: "Run Search Jobs" },
  { key: "auto_threat_scan", label: "Run Auto Threat Scan" },
  { key: "alert_escalation", label: "Run Escalation" },
  { key: "all", label: "Run All" }
];

export default function AdminSchedulerPanel() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [runningTask, setRunningTask] = useState("");

  const refresh = async () => {
    const res = await api.get("/admin/scheduler");
    setStatus(res.data);
  };

  useEffect(() => {
    setLoading(true);
    refresh()
      .catch((err) => setError(err?.response?.data?.message || "Failed to load scheduler status"))
      .finally(() => setLoading(false));
  }, []);

  const runTask = async (task) => {
    setRunningTask(task);
    setError("");
    try {
      await api.post("/admin/scheduler/run", { task });
      await refresh();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to run task");
    } finally {
      setRunningTask("");
    }
  };

  const taskMap = useMemo(() => {
    const map = new Map();
    for (const t of status?.tasks || []) map.set(t.key, t);
    return map;
  }, [status]);

  return (
    <section className="glass rounded-xl p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">Scheduler & Escalation</h3>
          <p className="text-xs text-slate-400">
            Scheduled log scanning, auto-threat detection, and alert escalation are managed here.
          </p>
        </div>
        <button onClick={refresh} className="rounded bg-white/10 px-3 py-1 text-xs" disabled={loading || !!runningTask}>
          Refresh
        </button>
      </div>

      {error && <div className="mb-2 rounded border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-300">{error}</div>}

      <div className="mb-3 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        {TASK_BUTTONS.map((b) => (
          <button
            key={b.key}
            onClick={() => runTask(b.key)}
            disabled={!!runningTask}
            className="rounded bg-orange-500 px-3 py-2 text-xs font-semibold text-black disabled:opacity-60"
          >
            {runningTask === b.key ? "Running..." : b.label}
          </button>
        ))}
      </div>

      <div className="mb-3 grid gap-3 md:grid-cols-2">
        <Meta label="Scheduler enabled" value={String(status?.enabled ?? false)} loading={loading} />
        <Meta label="Tick seconds" value={status?.tickSeconds ?? "-"} loading={loading} />
        <Meta label="Auto scan cron" value={status?.config?.autoThreatScanCron || "-"} loading={loading} />
        <Meta label="Escalation cron" value={status?.config?.alertEscalationCron || "-"} loading={loading} />
      </div>

      <div className="space-y-2 text-xs">
        {["search_jobs", "auto_threat_scan", "alert_escalation"].map((key) => {
          const task = taskMap.get(key);
          if (!task) return null;

          return (
            <div key={key} className="rounded border border-white/10 p-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">{task.label}</div>
                <span className={`rounded px-2 py-1 ${task.enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-500/20 text-slate-300"}`}>
                  {task.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="mt-1 text-slate-400">
                cron: {task.cron} | runs: {task.runCount} | success: {task.successCount} | failed: {task.failureCount}
              </div>
              <div className="mt-1 text-slate-400">
                last run: {task.lastRunAt ? new Date(task.lastRunAt).toLocaleString() : "never"}
                {task.lastDurationMs ? ` | duration: ${task.lastDurationMs}ms` : ""}
              </div>
              {task.lastError && <div className="mt-1 text-red-300">last error: {task.lastError}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Meta({ label, value, loading }) {
  return (
    <div className="rounded border border-white/10 p-2">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold">{loading ? "..." : String(value)}</div>
    </div>
  );
}