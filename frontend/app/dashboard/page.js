"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import api from "../../lib/api";

export default function DashboardPage() {
  const [panels, setPanels] = useState([]);
  const [panelData, setPanelData] = useState({});
  const [layouts, setLayouts] = useState([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState("");
  const [teamKey, setTeamKey] = useState("");
  const [layoutForm, setLayoutForm] = useState({ name: "", roleScope: "", teamScope: "" });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [newPanel, setNewPanel] = useState({ title: "", query: "", vizType: "METRIC" });
  const [dragId, setDragId] = useState("");

  const loadLayouts = async () => {
    const res = await api.get("/dashboard/layouts", { params: { teamKey: teamKey || undefined } });
    setLayouts(res.data || []);
  };

  const loadPanelData = async (panelList) => {
    const entries = await Promise.all(
      panelList.map(async (p) => {
        const res = await api.get(`/dashboard/panels/${p.id}/data`);
        return [p.id, res.data.data];
      })
    );
    setPanelData(Object.fromEntries(entries));
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");
      const [panelRes, layoutRes] = await Promise.all([
        api.get("/dashboard/panels"),
        api.get("/dashboard/layouts", { params: { teamKey: teamKey || undefined } })
      ]);
      const list = panelRes.data || [];
      setPanels(list);
      setLayouts(layoutRes.data || []);
      await loadPanelData(list);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createPanel = async () => {
    if (!newPanel.title.trim() || !newPanel.query.trim()) return;
    await api.post("/dashboard/panels", newPanel);
    setNewPanel({ title: "", query: "", vizType: "METRIC" });
    await loadAll();
  };

  const saveLayout = async () => {
    if (!layoutForm.name.trim()) return;
    await api.post("/dashboard/layouts", {
      name: layoutForm.name,
      roleScope: layoutForm.roleScope || undefined,
      teamScope: layoutForm.teamScope || undefined
    });
    setLayoutForm({ name: "", roleScope: "", teamScope: "" });
    await loadLayouts();
  };

  const applyLayout = async () => {
    if (!selectedLayoutId) return;
    await api.post(`/dashboard/layouts/${selectedLayoutId}/apply`, { teamKey: teamKey || undefined });
    await loadAll();
  };

  const reorder = async (ordered) => {
    setPanels(ordered);
    await api.post("/dashboard/panels/reorder", { panelIds: ordered.map((p) => p.id) });
  };

  const onDrop = async (targetId) => {
    if (!dragId || dragId === targetId) return;
    const list = [...panels];
    const fromIdx = list.findIndex((p) => p.id === dragId);
    const toIdx = list.findIndex((p) => p.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [item] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, item);
    await reorder(list);
    setDragId("");
  };

  return (
    <AppShell title="Security Dashboard">
      {error && <p className="mb-3 text-red-400">{error}</p>}

      <div className="glass mb-4 rounded-lg p-3">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Panel Editor</h3>
        <div className="grid gap-2 lg:grid-cols-[1fr_1fr_180px_120px]">
          <input className="rounded bg-black/20 p-2 text-sm" placeholder="Panel title" value={newPanel.title} onChange={(e) => setNewPanel((s) => ({ ...s, title: e.target.value }))} />
          <input className="rounded bg-black/20 p-2 text-sm" placeholder="Query" value={newPanel.query} onChange={(e) => setNewPanel((s) => ({ ...s, query: e.target.value }))} />
          <select className="rounded bg-black/20 p-2 text-sm" value={newPanel.vizType} onChange={(e) => setNewPanel((s) => ({ ...s, vizType: e.target.value }))}>
            <option value="METRIC">METRIC</option>
            <option value="TABLE">TABLE</option>
            <option value="PIE">PIE</option>
            <option value="LINE">LINE</option>
          </select>
          <button onClick={createPanel} className="rounded bg-orange-500 px-3 py-2 text-sm font-semibold text-black">Add Panel</button>
        </div>
      </div>

      <div className="glass mb-4 rounded-lg p-3">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Layouts by Role / Team</h3>
        <div className="grid gap-2 lg:grid-cols-[1fr_160px_160px_120px]">
          <input className="rounded bg-black/20 p-2 text-sm" placeholder="Layout name" value={layoutForm.name} onChange={(e) => setLayoutForm((s) => ({ ...s, name: e.target.value }))} />
          <select className="rounded bg-black/20 p-2 text-sm" value={layoutForm.roleScope} onChange={(e) => setLayoutForm((s) => ({ ...s, roleScope: e.target.value }))}>
            <option value="">Private</option>
            <option value="ADMIN">Role: ADMIN</option>
            <option value="SECURITY_ANALYST">Role: ANALYST</option>
          </select>
          <input className="rounded bg-black/20 p-2 text-sm" placeholder="Team key (optional)" value={layoutForm.teamScope} onChange={(e) => setLayoutForm((s) => ({ ...s, teamScope: e.target.value }))} />
          <button onClick={saveLayout} className="rounded bg-orange-500 px-3 py-2 text-sm font-semibold text-black">Save</button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input className="rounded bg-black/20 p-2 text-sm" placeholder="Team key for lookup/apply" value={teamKey} onChange={(e) => setTeamKey(e.target.value)} />
          <button onClick={loadLayouts} className="rounded bg-white/10 px-3 py-2 text-sm">Refresh</button>
          <select className="min-w-[280px] rounded bg-black/20 p-2 text-sm" value={selectedLayoutId} onChange={(e) => setSelectedLayoutId(e.target.value)}>
            <option value="">Select layout to apply</option>
            {layouts.map((l) => (
              <option key={l.id} value={l.id}>{l.name} {l.roleScope ? `(role ${l.roleScope})` : ""} {l.teamScope ? `(team ${l.teamScope})` : ""}</option>
            ))}
          </select>
          <button onClick={applyLayout} disabled={!selectedLayoutId} className="rounded bg-orange-500 px-3 py-2 text-sm font-semibold text-black disabled:opacity-40">Apply</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="glass rounded-lg p-4 animate-pulse">
              <div className="flex justify-between mb-2">
                <div className="h-4 w-32 bg-white/10 rounded" />
                <div className="h-4 w-12 bg-white/10 rounded" />
              </div>
              <div className="h-3 w-48 bg-white/5 rounded mb-4" />
              <div className="h-10 w-24 bg-white/10 rounded mb-2" />
              <div className="space-y-2 mt-4">
                <div className="h-3 bg-white/5 rounded w-full" />
                <div className="h-3 bg-white/5 rounded w-5/6" />
              </div>
            </div>
          ))
        ) : (
          panels.map((panel) => {
            const data = panelData[panel.id];
            return (
              <section
                key={panel.id}
                draggable
                onDragStart={() => setDragId(panel.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(panel.id)}
                className="glass rounded-lg p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">{panel.title}</h3>
                  <span className="rounded bg-white/10 px-2 py-1 text-xs">{panel.vizType}</span>
                </div>

                <div className="mb-2 text-xs text-slate-400">{panel.query}</div>

                {panel.vizType === "METRIC" && <div className="text-4xl font-bold text-orange-400">{data?.total ?? "..."}</div>}

                {panel.vizType !== "METRIC" && (
                  <div className="max-h-64 overflow-auto text-xs">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left">Label</th>
                          <th className="text-left">Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.bySource || []).map((r) => (
                          <tr key={r.source}>
                            <td>{r.source || "unknown"}</td>
                            <td>{r._count._all}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
