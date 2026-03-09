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

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
}

function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div>
      <p className="section-kicker">{eyebrow}</p>
      <h2 className="section-heading">{title}</h2>
      <p className="section-copy">{description}</p>
    </div>
  );
}

export default function App() {
  return (
    <div className="relative overflow-x-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_48%)]" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="section-shell flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <a href="#top" className="flex items-center gap-3 text-white">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-400/10 text-sm font-semibold text-sky-200">
              MM
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">MCP Manager</p>
              <p className="text-lg font-semibold tracking-tight">Documentation</p>
            </div>
          </a>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-3 py-2 hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <a
                href="#quickstart"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
              >
                Quickstart
              </a>
              <a
                href="#architecture"
                className="rounded-full bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-300"
              >
                Explore architecture
              </a>
            </div>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="section-shell grid gap-16 pb-24 pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pb-32 lg:pt-20">
          <div>
            <span className="chip">Centralized MCP configuration for modern AI tooling</span>
            <h1 className="mt-8 max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Configure MCP once. Sync everywhere.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              MCP Manager gives teams one polished control plane for every local MCP server, then translates those
              definitions into each client’s preferred format without the manual file wrangling.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-full bg-sky-400 px-6 py-3 text-base font-semibold text-slate-950 hover:bg-sky-300"
              >
                See what it solves
              </a>
              <a
                href="#supported-clients"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-base font-semibold text-white hover:bg-white/10"
              >
                Browse supported clients
              </a>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="glass-panel p-5">
                  <p className="text-3xl font-semibold text-white">{metric.value}</p>
                  <p className="mt-2 text-sm font-medium uppercase tracking-[0.24em] text-slate-400">{metric.label}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{metric.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel relative overflow-hidden p-8">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300 to-transparent" />
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Operational preview</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">A docsite that mirrors the product story</h2>
              </div>
              <span className="chip border-sky-300/20 bg-sky-300/10 text-sky-100">Static and GitHub Pages friendly</span>
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
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(74,222,128,0.12)]" />
                Build and ship
              </div>
              <pre className="mt-4 overflow-x-auto text-sm leading-7 text-slate-200">
                <code>{quickstartCommands}</code>
              </pre>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                The docs build emits static assets into <code className="rounded bg-white/5 px-1.5 py-0.5 text-slate-200">dist/docs</code> for later publishing.
              </p>
            </div>
          </div>
        </section>

        <section id="overview" className="section-shell pb-24">
          <SectionHeading
            eyebrow="Why this exists"
            title="MCP ecosystems grow faster than hand-maintained config files can keep up."
            description="MCP Manager turns scattered local settings into an intentional system: discover clients, import what already exists, and keep every target synchronized from one canonical model."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {problemCards.map((card) => (
              <article key={card.title} className="glass-panel p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-lg font-semibold text-sky-200">
                  {card.title.slice(0, 2).toUpperCase()}
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">{card.title}</h3>
                <p className="mt-4 text-base leading-8 text-slate-300">{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="features" className="section-shell pb-24">
          <SectionHeading
            eyebrow="Feature highlights"
            title="Everything needed to manage MCP configuration as a product, not a pile of local files."
            description="The current project already combines Electron, SQLite, translators, parsers, and a React operations UI. The docsite packages that story into a clear landing page for users and contributors."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature) => (
              <article key={feature.title} className="glass-panel flex h-full flex-col p-7">
                <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ring-1 ${feature.accent}`}>
                  Included
                </span>
                <h3 className="mt-5 text-2xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-4 flex-1 text-base leading-8 text-slate-300">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="supported-clients" className="section-shell pb-24">
          <SectionHeading
            eyebrow="Supported clients"
            title="One canonical server definition, translated into the config formats your tools actually expect."
            description="MCP Manager currently supports a broad spread of desktop tools and editors, from simple JSON files to YAML and XML-based integrations."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {supportedClients.map((client) => (
              <article key={client.name} className="glass-panel p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{client.name}</h3>
                    <p className="mt-2 text-sm text-slate-400">{client.note}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">
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
            ))}
          </div>
        </section>

        <section id="workflow" className="section-shell pb-24">
          <SectionHeading
            eyebrow="Workflow"
            title="An opinionated loop for keeping local AI tooling consistent."
            description="The product flow is straightforward on purpose: define your servers, import what is already installed, and sync every target with backup-first confidence."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <article key={step.title} className="glass-panel p-7">
                <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">Step {index + 1}</p>
                <h3 className="mt-4 text-2xl font-semibold text-white">{step.title}</h3>
                <p className="mt-4 text-base leading-8 text-slate-300">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="architecture" className="section-shell pb-24">
          <SectionHeading
            eyebrow="Architecture"
            title="Built as a secure desktop control plane with a modern React renderer."
            description="The docsite surfaces the project architecture in the same crisp way the app presents servers and integrations: clear layers, explicit responsibilities, and a secure IPC boundary."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              {architectureLayers.map((layer) => (
                <article key={layer.title} className="glass-panel p-7">
                  <h3 className="text-xl font-semibold text-white">{layer.title}</h3>
                  <p className="mt-4 text-base leading-8 text-slate-300">{layer.description}</p>
                  <ul className="mt-5 space-y-3 text-sm text-slate-300">
                    {layer.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <span className="mt-2 h-2 w-2 rounded-full bg-sky-300" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <div className="glass-panel overflow-hidden p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">System view</p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">How the pieces connect</h3>
                </div>
                <span className="chip">Electron + React + Tailwind + SQLite</span>
              </div>

              <pre className="mt-8 overflow-x-auto rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-6 text-sm leading-8 text-slate-200">
                <code>{architectureDiagram}</code>
              </pre>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-medium text-slate-400">Renderer stack</p>
                  <p className="mt-3 text-lg font-semibold text-white">React 18, TypeScript, Tailwind CSS, Vite</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-medium text-slate-400">Desktop foundation</p>
                  <p className="mt-3 text-lg font-semibold text-white">Electron main process with secure preload bridge</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="quickstart" className="section-shell pb-24">
          <SectionHeading
            eyebrow="Quickstart"
            title="Use the same repository tooling to run the product and the docs site."
            description="No extra packages are required. The docs experience shares the existing React, Vite, and Tailwind foundation, while staying isolated from the Electron runtime."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
            <div className="glass-panel p-7">
              <h3 className="text-xl font-semibold text-white">Commands</h3>
              <pre className="mt-6 overflow-x-auto rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-6 text-sm leading-8 text-slate-200">
                <code>{quickstartCommands}</code>
              </pre>
              <p className="mt-5 text-sm leading-7 text-slate-400">
                For deployment later, publish the contents of <code className="rounded bg-white/5 px-1.5 py-0.5 text-slate-200">dist/docs</code>.
              </p>
            </div>

            <div className="glass-panel p-7">
              <h3 className="text-xl font-semibold text-white">What this docs site covers</h3>
              <ul className="mt-6 space-y-4 text-base leading-8 text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-sky-300" />
                  A strong landing page for the project value proposition.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-sky-300" />
                  Clear summaries of supported clients, workflow, and architecture.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-sky-300" />
                  Static output with relative assets, which is convenient for GitHub Pages.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-sky-300" />
                  Styling that matches the project’s existing dark, high-contrast design language.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="faq" className="section-shell pb-24">
          <SectionHeading
            eyebrow="FAQ"
            title="A few practical answers before you publish."
            description="The docsite is intentionally lightweight and static, which keeps future GitHub Pages deployment simple."
          />

          <div className="mt-12 space-y-5">
            {faqItems.map((item) => (
              <article key={item.question} className="glass-panel p-7">
                <h3 className="text-xl font-semibold text-white">{item.question}</h3>
                <p className="mt-4 text-base leading-8 text-slate-300">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="section-shell pb-12">
        <div className="glass-panel flex flex-col gap-8 p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-kicker">Ready for publishing later</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">A polished docsite now, GitHub Pages deploy later.</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
              The docs build is isolated, static, and easy to host, while the Electron product continues to evolve independently.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="#top"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Back to top
            </a>
            <a
              href="#quickstart"
              className="inline-flex items-center justify-center rounded-full bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-300"
            >
              Build the docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
