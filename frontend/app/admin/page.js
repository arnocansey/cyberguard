"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import AdminSchedulerPanel from "../../components/AdminSchedulerPanel";
import api from "../../lib/api";

const USER_COLUMNS = ["fullName", "email", "role", "twoFaEnabled", "createdAt"];
const AUDIT_COLUMNS = ["createdAt", "user", "action", "resource", "ipAddress"];
const ALERT_COLUMNS = ["message", "severity", "status", "assignedTo", "createdAt"];

export default function AdminPage() {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersMeta, setUsersMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsMeta, setLogsMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [alerts, setAlerts] = useState([]);
  const [alertsMeta, setAlertsMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [rules, setRules] = useState([]);
  const [ruleSim, setRuleSim] = useState({});

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [usersPage, setUsersPage] = useState(1);
  const [userSortBy, setUserSortBy] = useState("createdAt");
  const [userSortOrder, setUserSortOrder] = useState("desc");
  const [userColumns, setUserColumns] = useState(USER_COLUMNS);

  const [logSearch, setLogSearch] = useState("");
  const [logsPage, setLogsPage] = useState(1);
  const [logSortBy, setLogSortBy] = useState("createdAt");
  const [logSortOrder, setLogSortOrder] = useState("desc");
  const [auditColumns, setAuditColumns] = useState(AUDIT_COLUMNS);

  const [alertStatus, setAlertStatus] = useState("");
  const [alertsPage, setAlertsPage] = useState(1);
  const [alertSortBy, setAlertSortBy] = useState("createdAt");
  const [alertSortOrder, setAlertSortOrder] = useState("desc");
  const [alertColumns, setAlertColumns] = useState(ALERT_COLUMNS);

  const [ruleForm, setRuleForm] = useState({ name: "", description: "", query: "", severity: "MEDIUM" });
  const [editingRuleId, setEditingRuleId] = useState("");
  const [editingRule, setEditingRule] = useState({ name: "", description: "", query: "", severity: "MEDIUM", enabled: true });

  const toggleColumn = (columns, setColumns, key) => {
    setColumns((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleError = (err, fallback) => {
    if (err?.response?.status === 403) {
      setForbidden(true);
      setError("Admin access required. Log in as an admin user.");
      return;
    }
    setError(err?.response?.data?.message || fallback);
  };

  const loadSummary = async () => {
    const res = await api.get("/admin/summary");
    setSummary(res.data);
  };

  const loadUsers = async () => {
    const res = await api.get("/admin/users", {
      params: {
        search: userSearch || undefined,
        role: roleFilter,
        page: usersPage,
        pageSize: 8,
        sortBy: userSortBy,
        sortOrder: userSortOrder
      }
    });
    setUsers(res.data.items || []);
    setUsersMeta({ page: res.data.page || 1, totalPages: res.data.totalPages || 1, total: res.data.total || 0 });
  };

  const exportUsersCsv = async () => {
    const res = await api.get("/admin/users/export", {
      params: { search: userSearch || undefined, role: roleFilter, sortBy: userSortBy, sortOrder: userSortOrder },
      responseType: "blob"
    });
    downloadBlob(new Blob([res.data], { type: "text/csv" }), "admin-users.csv");
  };

  const loadLogs = async () => {
    const res = await api.get("/admin/audit-logs", {
      params: { search: logSearch || undefined, page: logsPage, pageSize: 15, sortBy: logSortBy, sortOrder: logSortOrder }
    });
    setAuditLogs(res.data.items || []);
    setLogsMeta({ page: res.data.page || 1, totalPages: res.data.totalPages || 1, total: res.data.total || 0 });
  };

  const exportAuditCsv = async () => {
    const res = await api.get("/admin/audit-logs/export", {
      params: { search: logSearch || undefined, sortBy: logSortBy, sortOrder: logSortOrder },
      responseType: "blob"
    });
    downloadBlob(new Blob([res.data], { type: "text/csv" }), "audit-logs.csv");
  };

  const loadAlerts = async () => {
    const res = await api.get("/alerts", {
      params: {
        status: alertStatus || undefined,
        page: alertsPage,
        pageSize: 10,
        sortBy: alertSortBy,
        sortOrder: alertSortOrder
      }
    });
    setAlerts(res.data.items || []);
    setAlertsMeta({ page: res.data.page || 1, totalPages: res.data.totalPages || 1, total: res.data.total || 0 });
  };

  const exportAlertsCsv = () => {
    const header = ["message", "severity", "status", "assignedTo", "createdAt"];
    const body = alerts.map((a) =>
      [a.message, a.severity, a.status, a.assignedTo?.email || "", new Date(a.createdAt).toISOString()]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    downloadBlob(new Blob([[header.join(","), ...body].join("\n")], { type: "text/csv" }), "alerts-page.csv");
  };

  const loadRules = async () => {
    const res = await api.get("/correlation-rules");
    setRules(res.data || []);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadSummary(), loadUsers(), loadLogs(), loadAlerts(), loadRules()])
      .catch((err) => handleError(err, "Failed loading admin data"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (forbidden) return;
    loadUsers().catch((err) => handleError(err, "Failed to load users"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSearch, roleFilter, usersPage, userSortBy, userSortOrder, forbidden]);

  useEffect(() => {
    if (forbidden) return;
    loadLogs().catch((err) => handleError(err, "Failed to load logs"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logSearch, logsPage, logSortBy, logSortOrder, forbidden]);

  useEffect(() => {
    if (forbidden) return;
    loadAlerts().catch((err) => handleError(err, "Failed to load alerts"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertStatus, alertsPage, alertSortBy, alertSortOrder, forbidden]);

  const updateRole = async (userId, role) => {
    await api.patch(`/admin/users/${userId}/role`, { role });
    await loadUsers();
  };

  const triageAlert = async (id, status) => {
    await api.patch(`/alerts/${id}`, { status, isRead: true });
    await loadAlerts();
  };

  const getCurrentUserId = () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return "";
      const payload = JSON.parse(atob(token.split(".")[1] || ""));
      return payload.sub || "";
    } catch {
      return "";
    }
  };

  const assignAlertToMe = async (id) => {
    const me = getCurrentUserId();
    if (!me) return;
    await api.patch(`/alerts/${id}`, { assignedToId: me });
    await loadAlerts();
  };

  const openCopilotWithAlert = (alert) => {
    const prompt = [
      "Help me triage this alert and propose immediate containment steps:",
      `Alert message: ${alert?.message || "N/A"}`,
      `Severity: ${alert?.severity || "UNKNOWN"}`,
      `Status: ${alert?.status || "NEW"}`,
      `Assigned to: ${alert?.assignedTo?.email || "unassigned"}`,
      `Alert ID: ${alert?.id || "N/A"}`
    ].join("\n");

    window.dispatchEvent(
      new CustomEvent("soc-copilot:ask", {
        detail: { prompt, autoSend: true }
      })
    );
  };

  const createRule = async () => {
    if (!ruleForm.name.trim() || !ruleForm.query.trim()) return;
    await api.post("/correlation-rules", ruleForm);
    setRuleForm({ name: "", description: "", query: "", severity: "MEDIUM" });
    await loadRules();
  };

  const beginEditRule = (rule) => {
    setEditingRuleId(rule.id);
    setEditingRule({
      name: rule.name,
      description: rule.description || "",
      query: rule.query,
      severity: rule.severity,
      enabled: rule.enabled
    });
  };

  const saveRuleEdit = async () => {
    if (!editingRuleId) return;
    await api.patch(`/correlation-rules/${editingRuleId}`, editingRule);
    setEditingRuleId("");
    await loadRules();
  };

  const deleteRule = async (id) => {
    await api.delete(`/correlation-rules/${id}`);
    await loadRules();
  };

  const simulateRule = async (id) => {
    const res = await api.get(`/correlation-rules/${id}/simulate`);
    setRuleSim((s) => ({ ...s, [id]: res.data }));
  };

  if (forbidden) {
    return (
      <AppShell title="Admin Panel">
        <div className="glass rounded-xl p-6">
          <h2 className="text-xl font-semibold">Admin Access Required</h2>
          <p className="mt-2 text-slate-400">Your current role does not have admin privileges. Log in as an admin user to view this page.</p>
          <div className="mt-4">
            <Link href="/dashboard" className="rounded bg-orange-500 px-3 py-2 text-sm font-semibold text-black">Back to Dashboard</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Admin Panel">
      {error && <p className="mb-4 text-red-400">{error}</p>}

      <div className="mb-4 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Users" value={summary?.users} loading={loading} />
        <StatCard label="Admins" value={summary?.admins} loading={loading} />
        <StatCard label="Analysts" value={summary?.analysts} loading={loading} />
        <StatCard label="Open Incidents" value={summary?.openIncidents} loading={loading} />
        <StatCard label="Critical Threats" value={summary?.criticalThreats} loading={loading} />
        <StatCard label="Unread Alerts" value={summary?.unreadAlerts} loading={loading} />
      </div>

      <AdminSchedulerPanel />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass rounded-xl p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">User Management</h3>
            <div className="flex flex-wrap gap-2">
              <input className="rounded bg-black/20 p-1 text-sm" placeholder="Search users" value={userSearch} onChange={(e) => { setUsersPage(1); setUserSearch(e.target.value); }} />
              <select className="rounded bg-black/20 p-1 text-sm" value={roleFilter} onChange={(e) => { setUsersPage(1); setRoleFilter(e.target.value); }}>
                <option value="ALL">All roles</option>
                <option value="ADMIN">ADMIN</option>
                <option value="SECURITY_ANALYST">SECURITY_ANALYST</option>
              </select>
              <select className="rounded bg-black/20 p-1 text-sm" value={userSortBy} onChange={(e) => setUserSortBy(e.target.value)}>
                <option value="createdAt">createdAt</option>
                <option value="fullName">fullName</option>
                <option value="email">email</option>
                <option value="role">role</option>
              </select>
              <select className="rounded bg-black/20 p-1 text-sm" value={userSortOrder} onChange={(e) => setUserSortOrder(e.target.value)}>
                <option value="desc">desc</option>
                <option value="asc">asc</option>
              </select>
              <button onClick={exportUsersCsv} className="rounded bg-white/10 px-2 py-1 text-sm">CSV</button>
            </div>
          </div>

          <div className="mb-2 flex flex-wrap gap-2 text-xs">
            {USER_COLUMNS.map((key) => (
              <label key={key} className="rounded border border-white/10 px-2 py-1">
                <input type="checkbox" checked={userColumns.includes(key)} onChange={() => toggleColumn(userColumns, setUserColumns, key)} /> {key}
              </label>
            ))}
          </div>

          <div className="mb-2 text-xs opacity-75">{usersMeta.total} users found</div>
          <div className="space-y-2 text-sm">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="rounded border border-white/10 p-3 animate-pulse">
                  <div className="h-4 w-32 bg-white/10 rounded mb-2" />
                  <div className="h-3 w-48 bg-white/5 rounded mb-3" />
                  <div className="flex gap-2">
                    <div className="h-6 w-24 bg-white/10 rounded" />
                    <div className="h-6 w-16 bg-white/10 rounded" />
                  </div>
                </div>
              ))
            ) : (
              users.map((u) => (
                <div key={u.id} className="rounded border border-white/10 p-3">
                  {userColumns.includes("fullName") && <div className="font-medium">{u.fullName}</div>}
                  {userColumns.includes("email") && <div className="text-xs opacity-80">{u.email}</div>}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {userColumns.includes("role") && (
                      <select className="rounded bg-black/20 p-1" value={u.role} onChange={(e) => updateRole(u.id, e.target.value)}>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SECURITY_ANALYST">SECURITY_ANALYST</option>
                      </select>
                    )}
                    {userColumns.includes("twoFaEnabled") && <span className="rounded bg-white/10 px-2 py-1 text-xs">2FA: {u.twoFaEnabled ? "On" : "Off"}</span>}
                    {userColumns.includes("createdAt") && <span className="text-xs text-slate-400">{new Date(u.createdAt).toLocaleString()}</span>}
                  </div>
                </div>
              ))
            )}
          </div>

          <Pager page={usersMeta.page} totalPages={usersMeta.totalPages} onPrev={() => setUsersPage((p) => Math.max(1, p - 1))} onNext={() => setUsersPage((p) => Math.min(usersMeta.totalPages, p + 1))} />
        </section>

        <section className="glass rounded-xl p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Alert Triage Queue</h3>
            <div className="flex flex-wrap gap-2">
              <select className="rounded bg-black/20 p-1 text-sm" value={alertStatus} onChange={(e) => { setAlertsPage(1); setAlertStatus(e.target.value); }}>
                <option value="">All</option>
                <option value="NEW">NEW</option>
                <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
              <select className="rounded bg-black/20 p-1 text-sm" value={alertSortBy} onChange={(e) => setAlertSortBy(e.target.value)}>
                <option value="createdAt">createdAt</option>
                <option value="severity">severity</option>
                <option value="status">status</option>
              </select>
              <select className="rounded bg-black/20 p-1 text-sm" value={alertSortOrder} onChange={(e) => setAlertSortOrder(e.target.value)}>
                <option value="desc">desc</option>
                <option value="asc">asc</option>
              </select>
              <button onClick={exportAlertsCsv} className="rounded bg-white/10 px-2 py-1 text-sm">CSV</button>
            </div>
          </div>

          <div className="mb-2 flex flex-wrap gap-2 text-xs">
            {ALERT_COLUMNS.map((key) => (
              <label key={key} className="rounded border border-white/10 px-2 py-1">
                <input type="checkbox" checked={alertColumns.includes(key)} onChange={() => toggleColumn(alertColumns, setAlertColumns, key)} /> {key}
              </label>
            ))}
          </div>

          <div className="space-y-2 text-xs">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="rounded border border-white/10 p-2 animate-pulse">
                  <div className="h-4 w-4/5 bg-white/10 rounded mb-2" />
                  <div className="h-3 w-1/2 bg-white/5 rounded mb-3" />
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-white/10 rounded" />
                    <div className="h-6 w-12 bg-white/10 rounded" />
                    <div className="h-6 w-12 bg-white/10 rounded" />
                  </div>
                </div>
              ))
            ) : (
              alerts.map((a) => (
                <div key={a.id} className="rounded border border-white/10 p-2">
                  {alertColumns.includes("message") && <div className="mb-1 font-semibold">{a.message}</div>}
                  <div className="mb-2 text-slate-400">
                    {alertColumns.includes("severity") && <span>{a.severity} </span>}
                    {alertColumns.includes("status") && <span>| {a.status} </span>}
                    {alertColumns.includes("assignedTo") && <span>| {a.assignedTo?.email || "unassigned"} </span>}
                    {alertColumns.includes("createdAt") && <span>| {new Date(a.createdAt).toLocaleString()}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => assignAlertToMe(a.id)} className="rounded bg-blue-600 px-2 py-1 text-white">Assign me</button>
                    <button onClick={() => triageAlert(a.id, "ACKNOWLEDGED")} className="rounded bg-yellow-500 px-2 py-1 text-black">Ack</button>
                    <button onClick={() => triageAlert(a.id, "CLOSED")} className="rounded bg-green-600 px-2 py-1 text-white">Close</button>
                    {a.incident ? (
                      <span className="rounded bg-white/10 px-2 py-1">Incident: {a.incident.status}</span>
                    ) : (
                      <Link href={`/incidents?alertId=${a.id}`} className="rounded bg-orange-500 px-2 py-1 text-black">Create incident</Link>
                    )}
                    <button onClick={() => openCopilotWithAlert(a)} className="rounded border border-orange-400/60 px-2 py-1 text-orange-200">Ask Copilot</button>
                  </div>
                </div>
              ))
            )}
          </div>
          <Pager page={alertsMeta.page} totalPages={alertsMeta.totalPages} onPrev={() => setAlertsPage((p) => Math.max(1, p - 1))} onNext={() => setAlertsPage((p) => Math.min(alertsMeta.totalPages, p + 1))} />
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="glass rounded-xl p-4">
          <h3 className="mb-2 text-lg font-semibold">Correlation Rule Management</h3>
          <div className="space-y-2">
            <input className="w-full rounded bg-black/20 p-2 text-sm" placeholder="Rule name" value={ruleForm.name} onChange={(e) => setRuleForm((r) => ({ ...r, name: e.target.value }))} />
            <textarea className="w-full rounded bg-black/20 p-2 text-sm" placeholder="Description" value={ruleForm.description} onChange={(e) => setRuleForm((r) => ({ ...r, description: e.target.value }))} />
            <input className="w-full rounded bg-black/20 p-2 text-sm" placeholder="Query" value={ruleForm.query} onChange={(e) => setRuleForm((r) => ({ ...r, query: e.target.value }))} />
            <select className="w-full rounded bg-black/20 p-2 text-sm" value={ruleForm.severity} onChange={(e) => setRuleForm((r) => ({ ...r, severity: e.target.value }))}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
            <button onClick={createRule} className="rounded bg-orange-500 px-3 py-2 text-sm font-semibold text-black">Create Rule</button>
          </div>

          <ul className="mt-3 space-y-2 text-xs">
            {rules.map((r) => {
              const sim = ruleSim[r.id];
              const editing = editingRuleId === r.id;
              return (
                <li key={r.id} className="rounded border border-white/10 p-2">
                  {editing ? (
                    <div className="space-y-2">
                      <input className="w-full rounded bg-black/20 p-1" value={editingRule.name} onChange={(e) => setEditingRule((s) => ({ ...s, name: e.target.value }))} />
                      <textarea className="w-full rounded bg-black/20 p-1" value={editingRule.description} onChange={(e) => setEditingRule((s) => ({ ...s, description: e.target.value }))} />
                      <input className="w-full rounded bg-black/20 p-1" value={editingRule.query} onChange={(e) => setEditingRule((s) => ({ ...s, query: e.target.value }))} />
                      <select className="w-full rounded bg-black/20 p-1" value={editingRule.severity} onChange={(e) => setEditingRule((s) => ({ ...s, severity: e.target.value }))}>
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={editingRule.enabled} onChange={(e) => setEditingRule((s) => ({ ...s, enabled: e.target.checked }))} />Enabled</label>
                      <div className="flex gap-2">
                        <button onClick={saveRuleEdit} className="rounded bg-green-600 px-2 py-1 text-white">Save</button>
                        <button onClick={() => setEditingRuleId("")} className="rounded bg-white/10 px-2 py-1">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="font-semibold">{r.name}</div>
                      <div>{r.query}</div>
                      <div className="text-slate-400">{r.severity} | {r.enabled ? "Enabled" : "Disabled"}</div>
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => beginEditRule(r)} className="rounded bg-white/10 px-2 py-1">Edit</button>
                        <button onClick={() => deleteRule(r.id)} className="rounded bg-red-600 px-2 py-1 text-white">Delete</button>
                        <button onClick={() => simulateRule(r.id)} className="rounded bg-blue-600 px-2 py-1 text-white">Simulate</button>
                      </div>
                      {sim && (
                        <div className="mt-2 rounded border border-white/10 p-2 text-[11px]">
                          <div>Matched: {sim.matchedCount}</div>
                          <div>Sample: {sim.sample?.length || 0} rows</div>
                        </div>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="glass rounded-xl p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Audit Trail Viewer</h3>
            <div className="flex flex-wrap gap-2">
              <input className="rounded bg-black/20 p-1 text-sm" placeholder="Filter audit" value={logSearch} onChange={(e) => { setLogsPage(1); setLogSearch(e.target.value); }} />
              <select className="rounded bg-black/20 p-1 text-sm" value={logSortBy} onChange={(e) => setLogSortBy(e.target.value)}>
                <option value="createdAt">createdAt</option>
                <option value="action">action</option>
                <option value="resource">resource</option>
                <option value="ipAddress">ipAddress</option>
              </select>
              <select className="rounded bg-black/20 p-1 text-sm" value={logSortOrder} onChange={(e) => setLogSortOrder(e.target.value)}>
                <option value="desc">desc</option>
                <option value="asc">asc</option>
              </select>
              <button onClick={exportAuditCsv} className="rounded bg-white/10 px-2 py-1 text-sm">CSV</button>
            </div>
          </div>

          <div className="mb-2 flex flex-wrap gap-2 text-xs">
            {AUDIT_COLUMNS.map((key) => (
              <label key={key} className="rounded border border-white/10 px-2 py-1">
                <input type="checkbox" checked={auditColumns.includes(key)} onChange={() => toggleColumn(auditColumns, setAuditColumns, key)} /> {key}
              </label>
            ))}
          </div>

          <div className="max-h-[420px] overflow-auto text-xs">
            <table className="w-full">
              <thead>
                <tr>
                  {auditColumns.includes("createdAt") && <th className="text-left">Time</th>}
                  {auditColumns.includes("user") && <th className="text-left">User</th>}
                  {auditColumns.includes("action") && <th className="text-left">Action</th>}
                  {auditColumns.includes("resource") && <th className="text-left">Resource</th>}
                  {auditColumns.includes("ipAddress") && <th className="text-left">IP</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx} className="border-t border-white/10 animate-pulse">
                      {auditColumns.includes("createdAt") && <td className="py-2 pr-2"><div className="h-3 w-28 bg-white/10 rounded" /></td>}
                      {auditColumns.includes("user") && <td className="py-2 pr-2"><div className="h-3 w-20 bg-white/10 rounded" /></td>}
                      {auditColumns.includes("action") && <td className="py-2 pr-2"><div className="h-3 w-24 bg-white/10 rounded" /></td>}
                      {auditColumns.includes("resource") && <td className="py-2 pr-2"><div className="h-3 w-24 bg-white/10 rounded" /></td>}
                      {auditColumns.includes("ipAddress") && <td className="py-2"><div className="h-3 w-16 bg-white/10 rounded" /></td>}
                    </tr>
                  ))
                ) : (
                  auditLogs.map((a) => (
                    <tr key={a.id} className="border-t border-white/10">
                      {auditColumns.includes("createdAt") && <td className="py-1 pr-2">{new Date(a.createdAt).toLocaleString()}</td>}
                      {auditColumns.includes("user") && <td className="py-1 pr-2">{a.user?.email || "system"}</td>}
                      {auditColumns.includes("action") && <td className="py-1 pr-2">{a.action}</td>}
                      {auditColumns.includes("resource") && <td className="py-1 pr-2">{a.resource}</td>}
                      {auditColumns.includes("ipAddress") && <td className="py-1">{a.ipAddress || "-"}</td>}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pager page={logsMeta.page} totalPages={logsMeta.totalPages} onPrev={() => setLogsPage((p) => Math.max(1, p - 1))} onNext={() => setLogsPage((p) => Math.min(logsMeta.totalPages, p + 1))} />
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, loading }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      {loading ? (
        <div className="mt-2 h-7 w-12 animate-pulse rounded bg-white/10" />
      ) : (
        <div className="mt-1 text-2xl font-bold">{value ?? 0}</div>
      )}
    </div>
  );
}

function Pager({ page, totalPages, onPrev, onNext }) {
  return (
    <div className="mt-3 flex items-center justify-end gap-2 text-xs">
      <button onClick={onPrev} disabled={page <= 1} className="rounded bg-white/10 px-2 py-1 disabled:opacity-40">Prev</button>
      <span>Page {page} / {totalPages}</span>
      <button onClick={onNext} disabled={page >= totalPages} className="rounded bg-white/10 px-2 py-1 disabled:opacity-40">Next</button>
    </div>
  );
}
