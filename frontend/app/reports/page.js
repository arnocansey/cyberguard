"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import api from "../../lib/api";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/reports")
      .then((res) => setReports(res.data))
      .catch((err) => setError(err?.response?.data?.message || "Failed to load reports"));
  }, []);

  const download = async (id) => {
    const response = await api.get(`/reports/${id}/download`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${id}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AppShell title="Reports">
      {error && <p className="mb-3 text-red-400">{error}</p>}
      <div className="glass rounded-xl p-4">
        <h3 className="mb-3 font-semibold">Generated Incident Reports</h3>
        <ul className="space-y-2 text-sm">
          {reports.map((r) => (
            <li key={r.id} className="flex items-center justify-between rounded border border-white/10 p-2">
              <div>
                <div>Report ID: {r.id}</div>
                <div>Incident ID: {r.incidentId}</div>
                <div>Threat: {r.incident?.alert?.threat?.type}</div>
              </div>
              <button onClick={() => download(r.id)} className="rounded bg-cyan-500 px-3 py-1 text-black">
                Download PDF
              </button>
            </li>
          ))}
          {reports.length === 0 && <li>No reports available.</li>}
        </ul>
      </div>
    </AppShell>
  );
}
