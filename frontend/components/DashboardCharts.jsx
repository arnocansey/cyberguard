"use client";

import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts";

const pieColors = ["#f26f21", "#ff934b", "#e2a66f", "#be7a49", "#9a633d", "#6f4a30"];

export default function DashboardCharts({ stats }) {
  const pieData = stats?.threatCategories?.map((x) => ({ name: x.type, value: x._count._all })) || [];
  const lineData = [
    { day: "Mon", attacks: 12 },
    { day: "Tue", attacks: 19 },
    { day: "Wed", attacks: 8 },
    { day: "Thu", attacks: 24 },
    { day: "Fri", attacks: 16 }
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="glass rounded-lg p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Threat Categories</h3>
        <PieChart width={340} height={250}>
          <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={84} innerRadius={44}>
            {pieData.map((_, i) => (
              <Cell key={`cell-${i}`} fill={pieColors[i % pieColors.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: "#1b2230", border: "1px solid #374151", color: "#e5e7eb" }} />
        </PieChart>
      </div>
      <div className="glass rounded-lg p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Daily Attack Trend</h3>
        <LineChart width={370} height={250} data={lineData}>
          <CartesianGrid stroke="#2f3746" strokeDasharray="3 3" />
          <XAxis dataKey="day" stroke="#9aa4b5" />
          <YAxis stroke="#9aa4b5" />
          <Tooltip contentStyle={{ background: "#1b2230", border: "1px solid #374151", color: "#e5e7eb" }} />
          <Line type="monotone" dataKey="attacks" stroke="#f26f21" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </div>
    </div>
  );
}
