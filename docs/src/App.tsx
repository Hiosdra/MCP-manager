import { useState, useEffect, useRef, type ReactNode } from 'react';
import {
  architectureDiagram,
  architectureLayers,
  faqItems,
  featureCards,
  metrics,
  navItems,
  problemCards,
  quickstartCommands,
  supportedClients,
  workflowSteps,
} from './content';

/* ------------------------------------------------------------------ */
/*  Scroll-reveal hook                                                 */
/* ------------------------------------------------------------------ */

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold, rootMargin: '0px 0px -48px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section heading                                                    */
/* ------------------------------------------------------------------ */

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <Reveal>
      <p className="section-kicker">{eyebrow}</p>
      <h2 className="section-heading">{title}</h2>
      <p className="section-copy">{description}</p>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/*  Format badge colour                                                */
/* ------------------------------------------------------------------ */

function formatClass(format: string) {
  const f = format.toLowerCase();
  if (f.includes('xml')) return 'format-badge format-xml';
  if (f.includes('yaml')) return 'format-badge format-yaml';
  if (f.includes('jsonc')) return 'format-badge format-jsonc';
  return 'format-badge format-json';
}

/* ------------------------------------------------------------------ */
/*  Main app                                                           */
/* ------------------------------------------------------------------ */

export default function App() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="relative overflow-x-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[56rem] bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,_rgba(56,189,248,0.12),_transparent)]" />
      <div className="pointer-events-none absolute right-0 top-[20rem] -z-10 h-[40rem] w-[40rem] bg-[radial-gradient(circle,_rgba(139,92,246,0.08),_transparent_60%)]" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="section-shell flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <a href="#top" className="group flex items-center gap-3 text-white">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-400/10 text-sm font-semibold text-sky-200 transition-all duration-300 group-hover:border-sky-400/50 group-hover:shadow-[0_0_16px_-4px_rgba(56,189,248,0.3)]">
              MM
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">MCP Manager</p>
              <p className="text-lg font-semibold tracking-tight">Documentation</p>
            </div>
          </a>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <nav className="flex flex-wrap items-center gap-1 text-sm text-slate-300">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-3 py-2 transition-all duration-200 hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <a href="#quickstart" className="btn-ghost !px-4 !py-2 !text-sm">Quickstart</a>
              <a href="#architecture" className="btn-primary !px-4 !py-2 !text-sm">Explore architecture</a>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main id="top">

        {/* ── Hero ── */}
        <section className="section-shell grid gap-16 pb-24 pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pb-32 lg:pt-20">
          <Reveal>
            <span className="chip">Centralized MCP configuration for modern AI tooling</span>
            <h1 className="gradient-text mt-8 max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Configure MCP once.{'\u00A0'}Sync everywhere.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              MCP Manager gives teams one polished control plane for every local MCP server, then translates those
              definitions into each client's preferred format without the manual file wrangling.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a href="#features" className="btn-primary">See what it solves</a>
              <a href="#supported-clients" className="btn-ghost">Browse supported clients</a>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {metrics.map((metric, i) => (
                <Reveal key={metric.label} delay={i * 100}>
                  <div className="glass-panel glass-panel-hover p-5">
                    <p className="text-3xl font-semibold text-white">{metric.value}</p>
                    <p className="mt-2 text-sm font-medium uppercase tracking-[0.24em] text-slate-400">{metric.label}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{metric.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="glass-panel relative overflow-hidden p-8">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/60 to-transparent" />
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">How it works</p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">One control plane for every MCP client</h2>
                </div>
                <span className="chip border-sky-300/20 bg-sky-300/10 text-sky-100">Electron + React + SQLite</span>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                  <p className="text-sm font-medium text-slate-400">Core promise</p>
                  <p className="mt-3 text-lg font-semibold text-white">Translate one canonical MCP definition into every target format.</p>
                </div>
                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                  <p className="text-sm font-medium text-emerald-100">Safe writes by default</p>
                  <p className="mt-3 text-sm leading-7 text-emerald-50">
                    Backups, retries, and format-aware translators keep config sync predictable instead of risky.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 pulse-dot" />
                  Build and ship
                </div>
                <pre className="mt-4 overflow-x-auto text-sm leading-7 text-slate-200">
                  <code>{quickstartCommands}</code>
                </pre>
                <p className="mt-4 text-sm leading-7 text-slate-400">
                  Clone the repository, install dependencies, and start managing your MCP servers in minutes.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── Why this exists ── */}
        <section id="overview" className="section-shell pb-24">
          <SectionHeading
            eyebrow="Why this exists"
            title="MCP ecosystems grow faster than hand-maintained config files can keep up."
            description="MCP Manager turns scattered local settings into an intentional system: discover clients, import what already exists, and keep every target synchronized from one canonical model."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {problemCards.map((card, i) => (
              <Reveal key={card.title} delay={i * 100}>
                <article className="glass-panel glass-panel-hover h-full p-7">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-2xl">
                    {card.icon}
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-white">{card.title}</h3>
                  <p className="mt-4 text-base leading-8 text-slate-300">{card.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="section-shell pb-24">
          <SectionHeading
            eyebrow="Feature highlights"
            title="Everything needed to manage MCP configuration as a product, not a pile of local files."
            description="The project combines Electron, SQLite, translators, parsers, and a React operations UI into a cohesive desktop experience for users and contributors."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 80}>
                <article className="glass-panel glass-panel-hover flex h-full flex-col p-7">
                  <span className="text-3xl">{feature.icon}</span>
                  <h3 className="mt-5 text-2xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-4 flex-1 text-base leading-8 text-slate-300">{feature.description}</p>
                  <span className={`mt-6 inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ring-1 ${feature.accent}`}>
                    Included
                  </span>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Supported clients ── */}
        <section id="supported-clients" className="section-shell pb-24">
          <SectionHeading
            eyebrow="Supported clients"
            title="One canonical server definition, translated into the config formats your tools actually expect."
            description="MCP Manager currently supports a broad spread of desktop tools and editors, from simple JSON files to YAML and XML-based integrations."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {supportedClients.map((client, i) => (
              <Reveal key={client.name} delay={i * 60}>
                <article className="glass-panel glass-panel-hover h-full p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{client.name}</h3>
                      <p className="mt-2 text-sm text-slate-400">{client.note}</p>
                    </div>
                    <span className={formatClass(client.format)}>
                      {client.format}
                    </span>
                  </div>
                  <dl className="mt-6 space-y-3 text-sm text-slate-300">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-500">Config key</dt>
                      <dd className="font-mono text-sky-200">{client.configKey}</dd>
                    </div>
                  </dl>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Workflow ── */}
        <section id="workflow" className="section-shell pb-24">
          <SectionHeading
            eyebrow="Workflow"
            title="An opinionated loop for keeping local AI tooling consistent."
            description="The product flow is straightforward on purpose: define your servers, import what is already installed, and sync every target with backup-first confidence."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <Reveal key={step.title} delay={index * 120}>
                <article className="glass-panel glass-panel-hover h-full p-7">
                  <div className="step-number">{index + 1}</div>
                  <h3 className="mt-5 text-2xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-4 text-base leading-8 text-slate-300">{step.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Architecture ── */}
        <section id="architecture" className="section-shell pb-24">
          <SectionHeading
            eyebrow="Architecture"
            title="Built as a secure desktop control plane with a modern React renderer."
            description="Clear layers, explicit responsibilities, and a secure IPC boundary between the Electron main process and the React renderer."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              {architectureLayers.map((layer, i) => (
                <Reveal key={layer.title} delay={i * 100}>
                  <article className="glass-panel glass-panel-hover p-7">
                    <h3 className="text-xl font-semibold text-white">{layer.title}</h3>
                    <p className="mt-4 text-base leading-8 text-slate-300">{layer.description}</p>
                    <ul className="mt-5 space-y-3 text-sm text-slate-300">
                      {layer.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sky-300" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              ))}
            </div>

            <Reveal delay={150}>
              <div className="glass-panel overflow-hidden p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">System view</p>
                    <h3 className="mt-3 text-2xl font-semibold text-white">How the pieces connect</h3>
                  </div>
                  <span className="chip">Electron + React + Tailwind + SQLite</span>
                </div>

                <pre className="code-block mt-8">
                  <code>{architectureDiagram}</code>
                </pre>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5 transition-colors duration-200 hover:border-sky-400/20">
                    <p className="text-sm font-medium text-slate-400">Renderer stack</p>
                    <p className="mt-3 text-lg font-semibold text-white">React 18, TypeScript, Tailwind CSS, Vite</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5 transition-colors duration-200 hover:border-sky-400/20">
                    <p className="text-sm font-medium text-slate-400">Desktop foundation</p>
                    <p className="mt-3 text-lg font-semibold text-white">Electron main process with secure preload bridge</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Quickstart ── */}
        <section id="quickstart" className="section-shell pb-24">
          <SectionHeading
            eyebrow="Quickstart"
            title="Get up and running in under a minute."
            description="Clone the repo, install dependencies, and launch the Electron app. The stack uses React, Vite, and Tailwind — no extra packages required."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
            <Reveal>
              <div className="glass-panel p-7">
                <h3 className="text-xl font-semibold text-white">Commands</h3>
                <pre className="code-block mt-6">
                  <code>{quickstartCommands}</code>
                </pre>
                <p className="mt-5 text-sm leading-7 text-slate-400">
                  Run <code className="rounded bg-white/5 px-1.5 py-0.5 text-slate-200">npm run dev</code> to start the app in development mode with hot reload.
                </p>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="glass-panel p-7">
                <h3 className="text-xl font-semibold text-white">What's included</h3>
                <ul className="mt-6 space-y-4 text-base leading-8 text-slate-300">
                  {[
                    'Translators for 10 AI clients covering JSON, JSONC, YAML, and XML formats.',
                    'Automatic client detection and config import from installed tools.',
                    'Backup-first sync engine with retry logic and format-aware writes.',
                    'A polished React UI for managing servers, integrations, and sync targets.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-sky-300" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── FAQ (accordion) ── */}
        <section id="faq" className="section-shell pb-24">
          <SectionHeading
            eyebrow="FAQ"
            title="Common questions, answered."
            description="Practical answers about how MCP Manager works, what it supports, and how to get started."
          />

          <div className="mt-12 space-y-4">
            {faqItems.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <Reveal key={item.question} delay={i * 80}>
                  <div className="faq-item" data-open={isOpen}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="flex w-full items-center justify-between gap-4 p-7 text-left"
                    >
                      <h3 className="text-xl font-semibold text-white">{item.question}</h3>
                      <span
                        className="shrink-0 text-2xl text-slate-400 transition-transform duration-300"
                        style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                      >
                        +
                      </span>
                    </button>
                    <div
                      className="overflow-hidden transition-all duration-400 ease-out"
                      style={{
                        maxHeight: isOpen ? '12rem' : '0',
                        opacity: isOpen ? 1 : 0,
                      }}
                    >
                      <p className="px-7 pb-7 text-base leading-8 text-slate-300">{item.answer}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 bg-slate-950/60">
        <div className="section-shell flex flex-col items-center gap-6 py-12 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-xs font-semibold text-sky-200">
              MM
            </div>
            <p className="text-sm">MCP Manager — centralized MCP configuration for modern AI tooling.</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="#top" className="text-sm text-slate-400 transition-colors hover:text-white">Back to top ↑</a>
            <span className="text-slate-700">·</span>
            <a
              href="https://github.com/Hiosdra/MCP-manager"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-400 transition-colors hover:text-white"
            >
              GitHub →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
