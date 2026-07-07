"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "../../components/AppShell";
import api from "../../lib/api";

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const decodeUserId = () => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return "";
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return payload.sub || "";
  } catch {
    return "";
  }
};

function IncidentsPageContent() {
  const searchParams = useSearchParams();
  const preselectedAlertId = searchParams.get("alertId") || "";

  const [incidents, setIncidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedAlertId, setSelectedAlertId] = useState("");
  const [createNote, setCreateNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState({});

  const loadIncidents = async () => {
    const res = await api.get("/incidents");
    setIncidents(res.data || []);
  };

  const loadAlerts = async () => {
    const res = await api.get("/alerts", { params: { page: 1, pageSize: 100 } });
    setAlerts(res.data?.items || []);
  };

  const loadAll = async () => {
    await Promise.all([loadIncidents(), loadAlerts()]);
  };

  useEffect(() => {
    setLoading(true);
    loadAll()
      .catch((err) => setError(err?.response?.data?.message || "Failed to load incident data"))
      .finally(() => setLoading(false));
  }, []);

  const availableAlerts = useMemo(() => alerts.filter((a) => !a.incident), [alerts]);

  useEffect(() => {
    if (!preselectedAlertId) return;
    const found = availableAlerts.find((a) => a.id === preselectedAlertId);
    if (found) {
      setSelectedAlertId(preselectedAlertId);
      setError("");
      return;
    }

    const blocked = alerts.find((a) => a.id === preselectedAlertId && a.incident);
    if (blocked) {
      setError("This alert already has an incident.");
    }
  }, [preselectedAlertId, availableAlerts, alerts]);

  const createIncident = async (e) => {
    e.preventDefault();
    setError("");
    if (!selectedAlertId) {
      setError("Select an alert first.");
      return;
    }

    try {
      setSaving(true);
      await api.post("/incidents", { alertId: selectedAlertId, note: createNote || undefined });
      setSelectedAlertId("");
      setCreateNote("");
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create incident");
    } finally {
      setSaving(false);
    }
  };

  const setDraft = (id, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        status: prev[id]?.status || "IN_PROGRESS",
        resolution: prev[id]?.resolution || "",
        note: prev[id]?.note || "",
        ...patch
      }
    }));
  };

  const applyUpdate = async (incidentId, mode) => {
    setError("");
    const me = decodeUserId();
    const d = drafts[incidentId] || { status: "IN_PROGRESS", resolution: "", note: "" };

    const payload = {
      status: mode === "assign_me" ? "IN_PROGRESS" : mode === "close" ? "CLOSED" : d.status,
      assignedToId: mode === "assign_me" ? me : undefined,
      resolution: mode === "close" ? (d.resolution || "Closed by analyst") : d.resolution || undefined,
      note: d.note || undefined
    };

    try {
      setBusyId(incidentId);
      await api.patch(`/incidents/${incidentId}`, payload);
      setDrafts((prev) => ({ ...prev, [incidentId]: { status: payload.status || d.status, resolution: "", note: "" } }));
      await loadIncidents();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update incident");
    } finally {
      setBusyId("");
    }
  };

  const downloadReport = async (reportId) => {
    const response = await api.get(`/reports/${reportId}/download`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportId}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AppShell title="Incidents Management">
      <div className="glass mb-4 rounded-xl p-4 text-sm text-slate-300">
        <div className="font-semibold text-slate-100">How to use</div>
        <p className="mt-1">Pick an alert, create incident, assign to yourself, add notes/resolution, then close to auto-generate a PDF report.</p>
      </div>

      <form onSubmit={createIncident} className="glass rounded-xl p-4 space-y-3">
        <h3 className="font-semibold">Create Incident From Alert</h3>
        <select
          className="w-full rounded bg-black/20 p-2"
          value={selectedAlertId}
          onChange={(e) => setSelectedAlertId(e.target.value)}
        >
          <option value="">Select alert</option>
          {availableAlerts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.severity} | {a.threat?.type} | {a.message.slice(0, 80)}
            </option>
          ))}
        </select>
        <textarea
          className="w-full rounded bg-black/20 p-2"
          placeholder="Initial investigation note"
          value={createNote}
          onChange={(e) => setCreateNote(e.target.value)}
        />
        <button disabled={saving} className="rounded bg-orange-500 px-3 py-2 text-black disabled:opacity-50">
          {saving ? "Creating..." : "Create Incident"}
        </button>
      </form>

      {error && <p className="mt-4 text-red-400">{error}</p>}

      <div className="glass mt-4 rounded-xl p-4">
        <h3 className="mb-2 font-semibold">Incident Queue</h3>
        <ul className="space-y-3 text-sm">
          {loading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <li key={idx} className="rounded border border-white/10 p-3 animate-pulse">
                <div className="mb-2 grid gap-1 md:grid-cols-2">
                  <div className="h-4 w-4/5 bg-white/10 rounded" />
                  <div className="h-4 w-3/4 bg-white/10 rounded" />
                  <div className="h-4 w-1/2 bg-white/10 rounded" />
                  <div className="h-4 w-2/3 bg-white/10 rounded" />
                </div>
                <div className="grid gap-2 md:grid-cols-3 mt-3">
                  <div className="h-9 bg-white/5 rounded" />
                  <div className="h-9 bg-white/5 rounded" />
                  <div className="h-9 bg-white/5 rounded" />
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="h-7 w-20 bg-white/10 rounded" />
                  <div className="h-7 w-24 bg-white/10 rounded" />
                  <div className="h-7 w-24 bg-white/10 rounded" />
                </div>
              </li>
            ))
          ) : incidents.length > 0 ? (
            incidents.map((i) => {
              const d = drafts[i.id] || { status: i.status, resolution: "", note: "" };
              const locked = busyId === i.id;
              return (
                <li key={i.id} className="rounded border border-white/10 p-3">
                  <div className="mb-2 grid gap-1 text-xs text-slate-300 md:grid-cols-2">
                    <div><span className="text-slate-400">Incident:</span> {i.id}</div>
                    <div><span className="text-slate-400">Alert:</span> {i.alertId}</div>
                    <div><span className="text-slate-400">Status:</span> {i.status}</div>
                    <div><span className="text-slate-400">Assigned:</span> {i.assignedTo?.email || "unassigned"}</div>
                    <div><span className="text-slate-400">Severity:</span> {i.alert?.severity}</div>
                    <div><span className="text-slate-400">Threat:</span> {i.alert?.threat?.type}</div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-3">
                    <select
                      className="rounded bg-black/20 p-2"
                      value={d.status}
                      onChange={(e) => setDraft(i.id, { status: e.target.value })}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <input
                      className="rounded bg-black/20 p-2"
                      placeholder="Resolution"
                      value={d.resolution}
                      onChange={(e) => setDraft(i.id, { resolution: e.target.value })}
                    />
                    <input
                      className="rounded bg-black/20 p-2"
                      placeholder="Note"
                      value={d.note}
                      onChange={(e) => setDraft(i.id, { note: e.target.value })}
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <button disabled={locked} onClick={() => applyUpdate(i.id, "assign_me")} className="rounded bg-blue-600 px-2 py-1 text-xs text-white disabled:opacity-50">Assign me</button>
                    <button disabled={locked} onClick={() => applyUpdate(i.id, "update")} className="rounded bg-orange-500 px-2 py-1 text-xs text-black disabled:opacity-50">Save update</button>
                    <button disabled={locked} onClick={() => applyUpdate(i.id, "close")} className="rounded bg-green-600 px-2 py-1 text-xs text-white disabled:opacity-50">Close + report</button>
                    {i.report?.id && (
                      <button onClick={() => downloadReport(i.report.id)} className="rounded bg-white/10 px-2 py-1 text-xs">
                        Download PDF
                      </button>
                    )}
                  </div>
                </li>
              );
            })
          ) : (
            <li>No incidents yet.</li>
          )}
        </ul>
      </div>
    </AppShell>
  );
}

export default function IncidentsPage() {
  return (
    <Suspense fallback={<div className="p-5 text-slate-300">Loading incidents...</div>}>
      <IncidentsPageContent />
    </Suspense>
  );
}
