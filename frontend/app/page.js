"use client";

import Link from "next/link";
import { useEffect } from "react";
import ThemeToggle from "../components/ThemeToggle";

const workflow = [
  { title: "Collect", text: "Ingest Apache, Nginx, and firewall streams in one timeline." },
  { title: "Classify", text: "AI model labels SQLi, XSS, brute-force, DDoS, and anomalies." },
  { title: "Correlate", text: "Apply rule logic and saved searches to group meaningful attack chains." },
  { title: "Respond", text: "Promote alerts to incidents, assign analysts, and close with evidence." }
];

const modules = [
  { name: "Events Explorer", detail: "Facets, query language, saved searches, and scheduled jobs." },
  { name: "Threat Triage", detail: "Severity-first queue with assign/ack/close and live updates." },
  { name: "Incident Workbench", detail: "Notes, ownership, lifecycle statuses, and PDF reports." },
  { name: "Operator Admin", detail: "Audit trails, correlation rule simulation, role controls." },
  { name: "Query Dashboards", detail: "Drag/reorder panels with query-driven visual blocks." },
  { name: "AI Explainability", detail: "Model version and top-feature reasoning per prediction." }
];

export default function Home() {
  useEffect(() => {
    const nodes = document.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.14 }
    );

    nodes.forEach((node) => observer.observe(node));

    const onScroll = () => {
      document.documentElement.style.setProperty("--landing-scroll", String(window.scrollY || 0));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      nodes.forEach((node) => observer.unobserve(node));
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <main className="landing-page relative min-h-screen overflow-x-hidden">
      <div className="landing-orb landing-orb-one" />
      <div className="landing-orb landing-orb-two" />
      <div className="landing-orb landing-orb-three" />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="rounded-md border border-orange-400/40 bg-orange-500/15 px-2 py-1 text-xs font-semibold tracking-[0.16em] text-orange-300">SOC</div>
          <span className="text-sm text-slate-300">CyberGuard Platform</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <ThemeToggle variant="public" />
          <Link href="/login" className="rounded border border-white/15 px-4 py-2 text-slate-200 hover:bg-white/5">Login</Link>
          <Link href="/register" className="rounded bg-orange-500 px-4 py-2 font-semibold text-black hover:bg-orange-400">Start Free</Link>
        </div>
      </header>

      <section data-reveal className="reveal relative mx-auto grid w-full max-w-6xl gap-8 px-6 pb-10 pt-8 lg:grid-cols-[1.15fr_0.85fr] lg:pt-16">
        <div>
          <p className="mb-4 inline-flex items-center rounded-full border border-orange-400/35 bg-orange-500/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-orange-300">
            AI-Powered SOC
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-slate-100 md:text-6xl">
            Detect threats faster. Triage cleaner. Respond with confidence.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-300 md:text-lg">
            Unified event search, real-time alerting, correlation rules, and incident workflows designed for modern blue teams.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="rounded bg-orange-500 px-5 py-3 font-semibold text-black hover:bg-orange-400">Create Analyst Account</Link>
            <Link href="/login" className="rounded border border-white/20 px-5 py-3 text-slate-200 hover:bg-white/5">Go To Console</Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <Metric label="Events / day" value="10M+" />
            <Metric label="Detection types" value="6" />
            <Metric label="Avg triage" value="< 90s" />
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">Platform Highlights</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Feature title="Events Explorer" body="Facets, saved searches, search jobs, and CSV exports for high-volume investigation." />
            <Feature title="Alert Triage Queue" body="Assign, acknowledge, and close alerts with full audit visibility." />
            <Feature title="Correlation Rules" body="Create, simulate, and tune correlation logic before rollout." />
            <Feature title="Query-Driven Dashboards" body="Build panels from queries, save layouts by role/team, and reorder live." />
          </div>
        </div>
      </section>

      <section data-reveal className="reveal relative mx-auto w-full max-w-6xl px-6 pb-6">
        <div className="grid gap-3 md:grid-cols-3">
          <Tile title="Ingest" text="Apache, Nginx, and firewall logs parsed into structured events." />
          <Tile title="Detect" text="Python ML service classifies SQLi, XSS, brute force, DDoS, and anomalies." />
          <Tile title="Respond" text="Promote alerts to incidents, assign analysts, track resolution, and report." />
        </div>
      </section>

      <section data-reveal className="reveal relative mx-auto w-full max-w-6xl px-6 pb-8">
        <div className="glass rounded-2xl p-5 md:p-6">
          <div className="mb-4 text-xs uppercase tracking-[0.16em] text-slate-400">SOC Workflow</div>
          <div className="grid gap-3 md:grid-cols-4">
            {workflow.map((step, idx) => (
              <article key={step.title} className="rounded-xl border border-white/10 bg-black/10 p-4">
                <div className="mb-2 text-xs font-semibold tracking-[0.14em] text-orange-300">Step {idx + 1}</div>
                <h3 className="text-lg font-semibold text-slate-100">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal className="reveal relative mx-auto w-full max-w-6xl px-6 pb-8">
        <div className="mb-4 text-xs uppercase tracking-[0.16em] text-slate-400">Core Modules</div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <article key={m.name} className="glass rounded-xl p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-orange-300">{m.name}</h3>
              <p className="mt-2 text-sm text-slate-300">{m.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section data-reveal className="reveal relative mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="glass rounded-2xl p-6">
          <div className="grid gap-5 md:grid-cols-[1.3fr_0.7fr]">
            <div>
              <h2 className="text-3xl font-semibold text-slate-100">Ready to run your SOC from one workspace?</h2>
              <p className="mt-2 text-sm text-slate-300">Start with analyst onboarding, ingest sample logs, and drive first incident closure in minutes.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/register" className="rounded bg-orange-500 px-5 py-3 text-sm font-semibold text-black hover:bg-orange-400">Start Free</Link>
                <Link href="/login" className="rounded border border-white/20 px-5 py-3 text-sm text-slate-200 hover:bg-white/5">Open Console</Link>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/10 p-4 text-sm">
              <div className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-400">Deployment Ready</div>
              <ul className="space-y-2 text-slate-300">
                <li>Docker Compose services</li>
                <li>JWT + RBAC + audit logs</li>
                <li>AI microservice integration</li>
                <li>Live Socket alerts</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="text-xs uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-orange-300">{value}</div>
    </div>
  );
}

function Feature({ title, body }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/10 p-3">
      <div className="text-sm font-semibold text-slate-100">{title}</div>
      <p className="mt-1 text-xs text-slate-400">{body}</p>
    </div>
  );
}

function Tile({ title, text }) {
  return (
    <article className="glass rounded-xl p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-orange-300">{title}</h3>
      <p className="mt-2 text-sm text-slate-300">{text}</p>
    </article>
  );
}
