import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function AuthShell({ title, subtitle, children, footerText, footerLink, footerHref, rightTitle, rightBody }) {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 md:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(242,111,33,0.15),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(57,120,255,0.15),transparent_30%),linear-gradient(180deg,#111624_0%,#0f1115_42%,#0f1115_100%)]" />

      <div className="relative mx-auto mb-4 flex w-full max-w-5xl items-center justify-between">
        <Link href="/" className="text-xs uppercase tracking-[0.14em] text-orange-300">CyberGuard</Link>
        <ThemeToggle variant="public" />
      </div>

      <div className="relative mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="glass rounded-2xl p-6 md:p-8">
          <div className="mb-4 inline-flex items-center rounded-md border border-orange-400/35 bg-orange-500/10 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-orange-300">
            CyberGuard SOC
          </div>
          <h1 className="text-3xl font-semibold text-slate-100">{rightTitle}</h1>
          <p className="mt-3 text-sm text-slate-300">{rightBody}</p>

          <ul className="mt-6 space-y-2 text-xs text-slate-400">
            <li>Real-time threat alerts with severity routing</li>
            <li>Saved searches and scheduled detection jobs</li>
            <li>Incident assignment, notes, and response reports</li>
          </ul>

          <div className="mt-6">
            <Link href="/" className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-300 hover:text-orange-200">
              Back to Landing Page
            </Link>
          </div>
        </aside>

        <section className="glass rounded-2xl p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-slate-100">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>

          <div className="mt-5">{children}</div>

          <div className="mt-5 border-t border-white/10 pt-4 text-sm text-slate-400">
            {footerText}{" "}
            <Link href={footerHref} className="font-semibold text-orange-300 hover:text-orange-200">
              {footerLink}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
