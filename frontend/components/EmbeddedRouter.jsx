"use client";

import { MemoryRouter, Route, Routes, Link } from "react-router-dom";

function Overview() { return <p className="text-sm">Overview module rendered with React Router.</p>; }
function Alerts() { return <p className="text-sm">Alert stream module rendered with React Router.</p>; }

export default function EmbeddedRouter() {
  return (
    <MemoryRouter>
      <div className="mb-3 flex gap-2 text-xs">
        <Link to="/">Overview</Link>
        <Link to="/alerts">Alerts</Link>
      </div>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/alerts" element={<Alerts />} />
      </Routes>
    </MemoryRouter>
  );
}
