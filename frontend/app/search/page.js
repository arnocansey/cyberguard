"use client";

import { Fragment, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "../../components/AppShell";
import api from "../../lib/api";

const PAGE_SIZE = 25;
const ALL_COLUMNS = [
  ["createdAt", "Timestamp"],
  ["host", "Host"],
  ["source", "Source"],
  ["sourcetype", "Sourcetype"],
  ["statusCode", "Status"],
  ["rawPreview", "Raw Preview"],
  ["severity", "Severity"]
];

function SearchPageContent() {
  const router = useRouter();
  const params = useSearchParams();

  const [events, setEvents] = useState([]);
  const [facets, setFacets] = useState({ sources: [], sourcetypes: [], hosts: [], severities: [] });
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const [columns, setColumns] = useState(["createdAt", "host", "source", "rawPreview", "severity"]);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [savedSearches, setSavedSearches] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [newSavedName, setNewSavedName] = useState("");
  const [newJobName, setNewJobName] = useState("");
  const [newJobSchedule, setNewJobSchedule] = useState("EVERY_1H");
  const [newThreshold, setNewThreshold] = useState(1);

  const query = useMemo(() => params.get("q") || params.get("query") || "", [params]);
  const from = useMemo(() => params.get("from") || "", [params]);
  const to = useMemo(() => params.get("to") || "", [params]);
  const range = useMemo(() => params.get("range") || "24h", [params]);
  const page = useMemo(() => Number(params.get("page") || 1), [params]);
  const severityFilter = useMemo(() => params.get("severity") || "", [params]);

  const setParams = (updates) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") next.delete(k);
      else next.set(k, String(v));
    });
    if (!next.get("page")) next.set("page", "1");
    router.push(`/search?${next.toString()}`);
  };

  const toggleColumn = (col) => {
    setColumns((prev) => (prev.includes(col) ? prev.filter((x) => x !== col) : [...prev, col]));
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAllPage = () => {
    const ids = events.map((e) => e.id);
    setSelectedIds(ids);
  };

  const clearSelected = () => setSelectedIds([]);

  const loadSearch = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/search/events", {
        params: {
          query,
          from: from || undefined,
          to: to || undefined,
          severity: severityFilter || undefined,
          page,
          pageSize: PAGE_SIZE,
          sortBy,
          sortOrder
        }
      });
      setEvents(res.data.items || []);
      setFacets(res.data.facets || { sources: [], sourcetypes: [], hosts: [], severities: [] });
      setMeta({
        page: res.data.page || 1,
        totalPages: res.data.totalPages || 1,
        total: res.data.total || 0
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to run search");
    } finally {
      setLoading(false);
    }
  };

  const loadSaved = async () => {
    const [savedRes, jobsRes] = await Promise.all([api.get("/search/saved-searches"), api.get("/search/jobs")]);
    setSavedSearches(savedRes.data || []);
    setJobs(jobsRes.data || []);
  };

  useEffect(() => {
    loadSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, from, to, page, severityFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadSaved().catch(() => {});
  }, []);

  const runSavedSearch = (s) => {
    setParams({ q: s.query, range: s.timeRange, page: 1 });
  };

  const saveCurrentSearch = async () => {
    if (!newSavedName.trim()) return;
    await api.post("/search/saved-searches", { name: newSavedName.trim(), query, timeRange: range });
    setNewSavedName("");
    await loadSaved();
  };

  const createJob = async () => {
    if (!newJobName.trim()) return;
    await api.post("/search/jobs", {
      name: newJobName.trim(),
      query,
      schedule: newJobSchedule,
      resultThreshold: Number(newThreshold) || 1,
      enabled: true
    });
    setNewJobName("");
    await loadSaved();
  };

  const createAlertRule = async () => {
    const name = query ? `Rule: ${query.slice(0, 40)}` : "Rule: selected events";
    await api.post("/search/alert-rules", {
      name,
      query,
      resultThreshold: Math.max(1, selectedIds.length || 1),
      enabled: true
    });
  };

  const createIncidentBulk = async () => {
    await api.post("/search/incidents/bulk", { logIds: selectedIds });
    clearSelected();
  };

  const exportCsv = async () => {
    const res = await api.get("/search/events/export", {
      params: { query, from, to, severity: severityFilter || undefined, sortBy, sortOrder },
      responseType: "blob"
    });
    const url = URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "events-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell title="Events Explorer">
      {error && <p className="mb-3 text-red-400">{error}</p>}

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <button onClick={selectAllPage} className="rounded bg-white/10 px-2 py-1">Select page</button>
        <button onClick={clearSelected} className="rounded bg-white/10 px-2 py-1">Clear</button>
        <button onClick={createAlertRule} disabled={!query && selectedIds.length === 0} className="rounded bg-orange-500 px-2 py-1 text-black disabled:opacity-40">
          Create alert rule
        </button>
        <button onClick={createIncidentBulk} disabled={selectedIds.length === 0} className="rounded bg-red-500 px-2 py-1 text-white disabled:opacity-40">
          Create incident
        </button>
        <button onClick={exportCsv} className="rounded bg-white/10 px-2 py-1">CSV export</button>
        <span className="text-slate-400">Selected: {selectedIds.length}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr_300px]">
        <aside className="glass rounded-lg p-4 text-sm">
          <h3 className="mb-3 text-xs uppercase tracking-wide text-slate-400">Facets</h3>
          <FacetBlock title="source" rows={facets.sources.map((x) => [x.source || "unknown", x._count._all])} onPick={(v) => setParams({ q: `${query} source=${v}`.trim(), page: 1 })} loading={loading} />
          <FacetBlock title="sourcetype" rows={facets.sourcetypes.map((x) => [x.sourcetype || "unknown", x._count._all])} onPick={(v) => setParams({ q: `${query} sourcetype=${v}`.trim(), page: 1 })} loading={loading} />
          <FacetBlock title="host" rows={facets.hosts.map((x) => [x.host || "unknown", x._count._all])} onPick={(v) => setParams({ q: `${query} host=${v}`.trim(), page: 1 })} loading={loading} />
          <FacetBlock title="severity" rows={facets.severities.map((x) => [x.severity || "unknown", x._count._all])} onPick={(v) => setParams({ severity: v, page: 1 })} loading={loading} />
        </aside>

        <section className="glass rounded-lg p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>{loading ? "Running search..." : `${meta.total} events`}</span>
            <div className="flex items-center gap-2">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded bg-black/20 p-1">
                <option value="createdAt">Timestamp</option>
                <option value="source">Source</option>
                <option value="sourcetype">Sourcetype</option>
                <option value="host">Host</option>
                <option value="statusCode">Status</option>
              </select>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="rounded bg-black/20 p-1">
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
              <span>Page {meta.page}/{meta.totalPages}</span>
            </div>
          </div>

          <div className="mb-2 flex flex-wrap gap-2 text-xs">
            {ALL_COLUMNS.map(([key, label]) => (
              <label key={key} className="flex items-center gap-1 rounded border border-white/10 px-2 py-1">
                <input type="checkbox" checked={columns.includes(key)} onChange={() => toggleColumn(key)} />
                {label}
              </label>
            ))}
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Sel</th>
                  {columns.includes("createdAt") && <th className="text-left">Timestamp</th>}
                  {columns.includes("host") && <th className="text-left">Host</th>}
                  {columns.includes("source") && <th className="text-left">Source</th>}
                  {columns.includes("sourcetype") && <th className="text-left">Sourcetype</th>}
                  {columns.includes("statusCode") && <th className="text-left">Status</th>}
                  {columns.includes("rawPreview") && <th className="text-left">Raw Event Preview</th>}
                  {columns.includes("severity") && <th className="text-left">Severity</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse border-b border-white/5">
                      <td><div className="h-4 w-4 bg-white/10 rounded" /></td>
                      {columns.includes("createdAt") && <td className="py-3"><div className="h-4 w-28 bg-white/10 rounded" /></td>}
                      {columns.includes("host") && <td className="py-3"><div className="h-4 w-20 bg-white/10 rounded" /></td>}
                      {columns.includes("source") && <td className="py-3"><div className="h-4 w-24 bg-white/10 rounded" /></td>}
                      {columns.includes("sourcetype") && <td className="py-3"><div className="h-4 w-24 bg-white/10 rounded" /></td>}
                      {columns.includes("statusCode") && <td className="py-3"><div className="h-4 w-12 bg-white/10 rounded" /></td>}
                      {columns.includes("rawPreview") && <td className="py-3 pr-2"><div className="h-4 w-80 bg-white/5 rounded" /></td>}
                      {columns.includes("severity") && <td className="py-3"><div className="h-4 w-16 bg-white/10 rounded" /></td>}
                    </tr>
                  ))
                ) : (
                  events.map((e) => {
                    const threat = e.threats?.[0];
                    const open = expandedId === e.id;
                    const selected = selectedIds.includes(e.id);
                    return (
                      <Fragment key={e.id}>
                        <tr className="cursor-pointer" onClick={() => setExpandedId(open ? "" : e.id)}>
                          <td onClick={(evt) => evt.stopPropagation()}>
                            <input type="checkbox" checked={selected} onChange={() => toggleSelected(e.id)} />
                          </td>
                          {columns.includes("createdAt") && <td>{new Date(e.createdAt).toLocaleString()}</td>}
                          {columns.includes("host") && <td>{e.host || "-"}</td>}
                          {columns.includes("source") && <td>{e.source}</td>}
                          {columns.includes("sourcetype") && <td>{e.sourcetype || "-"}</td>}
                          {columns.includes("statusCode") && <td>{e.statusCode ?? "-"}</td>}
                          {columns.includes("rawPreview") && <td className="max-w-[420px] truncate">{e.raw}</td>}
                          {columns.includes("severity") && <td>{threat?.severity || "-"}</td>}
                        </tr>
                        {open && (
                          <tr>
                            <td colSpan={columns.length + 1}>
                              <div className="mt-2 grid gap-3 rounded border border-white/10 bg-black/20 p-3 text-xs lg:grid-cols-2">
                                <div>
                                  <div className="mb-1 font-semibold text-slate-300">Raw Event</div>
                                  <pre className="overflow-auto whitespace-pre-wrap text-slate-200">{e.raw}</pre>
                                </div>
                                <div>
                                  <div className="mb-1 font-semibold text-slate-300">Full JSON</div>
                                  <pre className="overflow-auto whitespace-pre-wrap text-slate-200">{JSON.stringify(e, null, 2)}</pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
            {!loading && events.length === 0 && <p className="mt-3 text-sm text-slate-400">No events match current query.</p>}
          </div>

          <div className="mt-3 flex items-center justify-end gap-2 text-xs">
            <button onClick={() => setParams({ page: Math.max(1, meta.page - 1) })} disabled={meta.page <= 1} className="rounded bg-white/10 px-2 py-1 disabled:opacity-40">Prev</button>
            <button onClick={() => setParams({ page: Math.min(meta.totalPages, meta.page + 1) })} disabled={meta.page >= meta.totalPages} className="rounded bg-white/10 px-2 py-1 disabled:opacity-40">Next</button>
          </div>
        </section>

        <aside className="glass rounded-lg p-4 text-sm">
          <h3 className="mb-2 text-xs uppercase tracking-wide text-slate-400">Saved Searches</h3>
          <div className="mb-2 flex gap-2">
            <input className="flex-1 rounded bg-black/20 p-1" placeholder="Name" value={newSavedName} onChange={(e) => setNewSavedName(e.target.value)} />
            <button onClick={saveCurrentSearch} className="rounded bg-orange-500 px-2 py-1 text-black">Save</button>
          </div>
          <ul className="mb-4 space-y-1">
            {savedSearches.map((s) => (
              <li key={s.id} className="rounded border border-white/10 p-2">
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-slate-400">{s.query}</div>
                <button onClick={() => runSavedSearch(s)} className="mt-1 rounded bg-white/10 px-2 py-1 text-xs">Run</button>
              </li>
            ))}
          </ul>

          <h3 className="mb-2 text-xs uppercase tracking-wide text-slate-400">Search Jobs</h3>
          <div className="space-y-2">
            <input className="w-full rounded bg-black/20 p-1" placeholder="Job name" value={newJobName} onChange={(e) => setNewJobName(e.target.value)} />
            <select className="w-full rounded bg-black/20 p-1" value={newJobSchedule} onChange={(e) => setNewJobSchedule(e.target.value)}>
              <option value="EVERY_5M">Every 5m</option>
              <option value="EVERY_1H">Every 1h</option>
              <option value="DAILY">Daily</option>
            </select>
            <input className="w-full rounded bg-black/20 p-1" type="number" min={1} value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)} placeholder="Threshold" />
            <button onClick={createJob} className="rounded bg-orange-500 px-2 py-1 text-black">Create Job</button>
          </div>
          <ul className="mt-3 space-y-1">
            {jobs.map((j) => (
              <li key={j.id} className="rounded border border-white/10 p-2 text-xs">
                <div className="font-medium">{j.name}</div>
                <div>{j.schedule} / threshold {j.resultThreshold}</div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </AppShell>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-5 text-slate-300">Loading search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}

function FacetBlock({ title, rows, onPick, loading }) {
  return (
    <div className="mb-4">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</div>
      <ul className="space-y-1">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <li key={idx} className="h-7 w-full animate-pulse rounded bg-white/5" />
          ))
        ) : rows.length > 0 ? (
          rows.map(([label, count]) => (
            <li key={`${title}-${label}`}>
              <button onClick={() => onPick(label)} className="flex w-full items-center justify-between rounded border border-white/10 px-2 py-1 text-left hover:bg-white/5">
                <span className="truncate pr-2">{label}</span>
                <span className="text-slate-300">{count}</span>
              </button>
            </li>
          ))
        ) : (
          <li className="text-xs text-slate-500">No data</li>
        )}
      </ul>
    </div>
  );
}
