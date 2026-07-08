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

                <PanelVisualizer vizType={panel.vizType} data={data} />
              </section>
            );
          })
        )}
      </div>
    </AppShell>
  );
}

function PanelVisualizer({ vizType, data }) {
  if (!data) {
    return <div className="text-slate-400 text-xs py-4">No data available</div>;
  }

  if (vizType === "METRIC") {
    return (
      <div className="py-6 flex flex-col justify-center">
        <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300 drop-shadow-[0_0_15px_rgba(249,115,22,0.2)]">
          {data.total ?? 0}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Total Logs Count</div>
      </div>
    );
  }

  const severityColors = {
    CRITICAL: "#ef4444",
    HIGH: "#f97316",
    MEDIUM: "#eab308",
    LOW: "#3b82f6",
    INFO: "#64748b"
  };
  const categoryColors = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4"];

  if (vizType === "PIE") {
    const severityData = data.bySeverity || [];
    const hasSeverity = severityData.length > 0;
    
    const items = hasSeverity 
      ? severityData.map(s => ({ label: s.severity, count: s._count._all, color: severityColors[s.severity] || severityColors.INFO }))
      : (data.bySource || []).map((s, idx) => ({ label: s.source || "unknown", count: s._count._all, color: categoryColors[idx % categoryColors.length] }));

    const total = items.reduce((sum, item) => sum + item.count, 0);

    if (total === 0) {
      return <div className="text-slate-500 text-xs py-4">0 matches found</div>;
    }

    let currentPercentage = 0;
    const slices = items.map((item) => {
      const percentage = (item.count / total) * 100;
      const start = currentPercentage;
      currentPercentage += percentage;
      return `${item.color} ${start}% ${currentPercentage}%`;
    }).join(", ");

    return (
      <div className="flex items-center gap-6 py-4">
        <div 
          className="relative h-28 w-28 shrink-0 rounded-full border border-white/5 shadow-inner"
          style={{ background: `conic-gradient(${slices})` }}
        >
          <div className="absolute inset-[24%] rounded-full bg-[#0d1117] flex items-center justify-center flex-col">
            <span className="text-base font-bold text-white">{total}</span>
            <span className="text-[8px] text-slate-500 uppercase tracking-widest">events</span>
          </div>
        </div>

        <div className="flex-1 space-y-1.5 max-h-[120px] overflow-auto text-xs">
          {items.map((item) => {
            const percentage = ((item.count / total) * 100).toFixed(0);
            return (
              <div key={item.label} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 font-medium truncate uppercase">{item.label}</span>
                </div>
                <span className="text-slate-400 shrink-0 font-mono">
                  {item.count} <span className="text-[10px] text-slate-500">({percentage}%)</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (vizType === "LINE") {
    const items = data.bySource || [];
    if (items.length === 0) {
      return <div className="text-slate-500 text-xs py-4">No source data for trendline</div>;
    }

    const counts = items.map(i => i._count._all);
    const maxVal = Math.max(...counts, 1);
    
    const width = 360;
    const height = 110;
    const padding = 15;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = items.map((item, idx) => {
      const x = padding + (idx / (items.length - 1 || 1)) * chartWidth;
      const y = padding + chartHeight - (item._count._all / maxVal) * chartHeight;
      return { x, y, label: item.source || "unknown", count: item._count._all };
    });

    const linePath = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaPath = points.length > 0 
      ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : "";

    return (
      <div className="py-2">
        <div className="relative">
          <svg className="w-full h-[110px]" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
            <line x1={padding} y1={padding + chartHeight / 2} x2={width - padding} y2={padding + chartHeight / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" />

            {areaPath && <path d={areaPath} fill="url(#chartGlow)" />}
            {linePath && <path d={linePath} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />}

            {points.map((p, idx) => (
              <g key={idx}>
                <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#f97316" strokeWidth="2" />
                <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#f97316" className="text-[8px] font-bold font-mono">
                  {p.count}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="flex justify-between px-3 text-[9px] uppercase tracking-wider text-slate-500 font-mono mt-1">
          {items.map((item, idx) => (
            <span key={idx} className="truncate max-w-[60px]" title={item.source}>{item.source || "unknown"}</span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-64 overflow-auto text-xs py-2">
      <table className="w-full text-slate-300">
        <thead>
          <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            <th className="text-left pb-1.5">Source Stream</th>
            <th className="text-right pb-1.5">Telemetry Count</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {(data.bySource || []).map((r, idx) => (
            <tr key={r.source || idx} className="hover:bg-white/5 transition-colors">
              <td className="py-2 text-slate-300 font-medium">{r.source || "unknown"}</td>
              <td className="py-2 text-right text-orange-400 font-mono font-bold">{r._count._all}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
