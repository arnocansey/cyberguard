"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/AppShell";
import api from "../../lib/api";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [file, setFile] = useState(null);
  const [source, setSource] = useState("apache");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const loadLogs = async () => {
    const res = await api.get("/logs");
    setLogs(res.data);
  };

  useEffect(() => {
    loadLogs().catch((err) => setError(err?.response?.data?.message || "Failed to load logs"));
  }, []);

  const summary = useMemo(() => {
    const threats = uploadResult?.threats || [];
    const byType = {};
    const bySeverity = {};
    const modelVersions = new Set();

    for (const item of threats) {
      const type = item?.threat?.type || "UNKNOWN";
      const sev = item?.threat?.severity || "UNKNOWN";
      byType[type] = (byType[type] || 0) + 1;
      bySeverity[sev] = (bySeverity[sev] || 0) + 1;
      if (item?.ai?.modelVersion) modelVersions.add(item.ai.modelVersion);
    }

    const firstExplanation = threats.find((t) => t?.ai?.explanation)?.ai?.explanation || null;
    const firstGuidance = threats.find((t) => t?.ai?.guidance)?.ai?.guidance || null;

    return {
      processed: uploadResult?.processed || 0,
      threatsCount: threats.length,
      byType,
      bySeverity,
      modelVersions: [...modelVersions],
      firstExplanation,
      firstGuidance
    };
  }, [uploadResult]);

  const upload = async () => {
    setError("");
    setUploadResult(null);

    if (!file) {
      setError("Please select a log file first.");
      return;
    }

    try {
      setUploading(true);
      const form = new FormData();
      form.append("file", file);
      form.append("source", source);
      const res = await api.post("/logs/upload", form);
      setUploadResult(res.data);
      await loadLogs();
      setFile(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const requestClearLogs = () => {
    setError("");
    setConfirmOpen(true);
  };

  const confirmClearLogs = async () => {
    try {
      setClearing(true);
      await api.delete("/logs");
      setUploadResult(null);
      setConfirmOpen(false);
      await loadLogs();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to clear logs");
    } finally {
      setClearing(false);
    }
  };

  return (
    <AppShell title="Logs Management">
      <div className="glass mb-4 rounded-xl p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-3">Upload Ingest Stream</h3>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative flex items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/10 px-4 py-2 hover:bg-black/20 cursor-pointer transition-colors text-xs font-medium text-slate-300">
            <span>{file ? file.name : "Select Log File (.log, .txt)"}</span>
            <input type="file" accept=".log,.txt" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Source:</span>
            <select className="rounded-lg bg-black/20 p-2 text-xs border border-white/15 text-slate-300 outline-none" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="apache">Apache</option>
              <option value="nginx">Nginx</option>
              <option value="firewall">Firewall</option>
            </select>
          </div>
          <button onClick={upload} disabled={uploading || clearing} className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-black hover:bg-orange-400 transition-colors disabled:opacity-50">
            {uploading ? "Uploading..." : "Upload Stream"}
          </button>
          <button
            onClick={requestClearLogs}
            disabled={uploading || clearing || logs.length === 0}
            className="rounded-lg border border-red-400/40 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/10 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {clearing ? "Clearing..." : "Clear all logs"}
          </button>
        </div>
        {error && <p className="mt-3 text-red-400 text-xs font-semibold">{error}</p>}
      </div>

      {uploadResult && (
        <div className="glass mb-4 rounded-xl p-4 text-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold">Detection Summary</h3>
            {summary.threatsCount > 0 && (
              <Link href="/threats" className="rounded bg-orange-500 px-3 py-1 text-xs font-semibold text-black">
                View detected threats
              </Link>
            )}
          </div>

          <div className="mb-3 grid gap-3 md:grid-cols-3">
            <SummaryStat label="Processed Logs" value={summary.processed} />
            <SummaryStat label="Threats Detected" value={summary.threatsCount} />
            <SummaryStat label="Model Version" value={summary.modelVersions[0] || "n/a"} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded border border-white/10 p-3">
              <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">By Type</div>
              {Object.keys(summary.byType).length === 0 && <div className="text-slate-400">No threats returned.</div>}
              {Object.entries(summary.byType).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>

            <div className="rounded border border-white/10 p-3">
              <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">By Severity</div>
              {Object.keys(summary.bySeverity).length === 0 && <div className="text-slate-400">No threats returned.</div>}
              {Object.entries(summary.bySeverity).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {summary.firstExplanation && (
            <div className="mt-3 rounded border border-white/10 p-3 text-xs">
              <div className="mb-1 uppercase tracking-wide text-slate-400">AI Explanation (sample)</div>
              <div className="mb-2 text-slate-300">{summary.firstExplanation.reason}</div>
              <ul className="space-y-1 text-slate-300">
                {(summary.firstExplanation.top_features || []).map((f) => (
                  <li key={f.feature}>{f.feature}: {f.value}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.firstGuidance && (
            <div className="mt-3 rounded border border-orange-400/35 bg-orange-500/5 p-3 text-xs">
              <div className="mb-1 uppercase tracking-wide text-orange-300">Threat Treatment Guidance (sample)</div>
              <div className="mb-2 text-slate-300">{summary.firstGuidance.summary}</div>
              <div className="mb-2 text-slate-400">Confidence band: {summary.firstGuidance.confidence_band}</div>

              <div className="mb-1 font-semibold text-slate-200">Immediate Actions</div>
              <ul className="mb-2 list-disc space-y-1 pl-5 text-slate-300">
                {(summary.firstGuidance.immediate_actions || []).map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>

              <div className="mb-1 font-semibold text-slate-200">Next 24h</div>
              <ul className="mb-2 list-disc space-y-1 pl-5 text-slate-300">
                {(summary.firstGuidance.next_24h_actions || []).map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>

              <div className="mb-1 font-semibold text-slate-200">False Positive Checks</div>
              <ul className="list-disc space-y-1 pl-5 text-slate-300">
                {(summary.firstGuidance.false_positive_checks || []).map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.threatsCount > 0 && !summary.firstGuidance && (
            <div className="mt-3 rounded border border-yellow-400/35 bg-yellow-500/5 p-3 text-xs text-yellow-200">
              No AI guidance returned for this upload.
            </div>
          )}
        </div>
      )}

      <div className="glass rounded-xl p-4 overflow-hidden">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-3">Recent Logs Activity</h3>
        <div className="max-h-[400px] overflow-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-2 pr-4">IP Address</th>
                <th className="pb-2 pr-4">Method</th>
                <th className="pb-2 pr-4">Path</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-slate-500">No logs ingested yet.</td>
                </tr>
              ) : (
                logs.map((log) => {
                  let statusColor = "text-slate-400";
                  if (log.statusCode >= 200 && log.statusCode < 300) statusColor = "text-emerald-400 font-bold";
                  else if (log.statusCode >= 300 && log.statusCode < 400) statusColor = "text-sky-400";
                  else if (log.statusCode >= 400 && log.statusCode < 500) statusColor = "text-amber-400 font-bold";
                  else if (log.statusCode >= 500) statusColor = "text-rose-400 font-bold";

                  return (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 pr-4 font-mono text-slate-300">{log.ipAddress}</td>
                      <td className="py-2.5 pr-4">
                        <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-orange-300 uppercase">
                          {log.method}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-slate-300 break-all">{log.path}</td>
                      <td className={`py-2.5 text-right font-mono ${statusColor}`}>{log.statusCode}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/20 bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-100">Clear all logs?</h3>
            <p className="mt-2 text-sm text-slate-300">
              This will delete all logs and related threats, alerts, and incidents. This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={clearing}
                className="rounded border border-slate-500 px-3 py-1.5 text-slate-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClearLogs}
                disabled={clearing}
                className="rounded bg-red-500 px-3 py-1.5 font-semibold text-white disabled:opacity-50"
              >
                {clearing ? "Clearing..." : "Yes, clear all"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function SummaryStat({ label, value }) {
  return (
    <div className="rounded border border-white/10 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-semibold text-orange-300">{value}</div>
    </div>
  );
}
