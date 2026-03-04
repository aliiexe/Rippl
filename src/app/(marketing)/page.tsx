import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { RippleLogo } from "@/components/ripple-logo";

const faqs = [
  {
    q: "Does Rippl send from my own Gmail?",
    a: "Yes. Rippl connects to your Gmail via OAuth, so every message is sent from your own address and preserves your identity and deliverability.",
  },
  {
    q: "Is my data safe?",
    a: "We use Supabase (PostgreSQL) with row-level security and industry-standard OAuth flows. You stay in control of your data and can disconnect integrations at any time.",
  },
  {
    q: "Can I use it for non-tech communities?",
    a: "Absolutely. Rippl works great for clubs, nonprofits, campus organizations, volunteer groups, and any team that needs organized communication.",
  },
  {
    q: "What AI model does it use?",
    a: "By default, Rippl uses free OpenRouter-hosted models like mistral-7b-instruct, and you can plug in your own OpenRouter key in Settings for more options.",
  },
  {
    q: "Is there a mobile app?",
    a: "Not yet. Rippl is optimized for modern mobile browsers so you can manage your groups and messages on the go.",
  },
];

const features = [
  {
    title: "Dashboard & Analytics",
    description: "Overview of activity and email analytics with export to CSV.",
    icon: "📊",
  },
  {
    title: "Groups",
    description: "Create and manage groups with members, filters, and emojis. Import or add contacts manually.",
    icon: "👥",
  },
  {
    title: "Compose",
    description: "Write once, send to a group. Templates, {{name}} personalization, and send now or schedule for later.",
    icon: "✉️",
  },
  {
    title: "AI email drafting",
    description: "Describe what you want to say; Rippl drafts subject and body. Choose tone (professional, friendly, casual).",
    icon: "✨",
  },
  {
    title: "Events",
    description: "Create Google Calendar events and optionally send invite emails to a group. AI can generate event descriptions.",
    icon: "📅",
  },
  {
    title: "Reminders",
    description: "Scheduled and sent emails appear in Reminders. Track what’s going out and when.",
    icon: "⏰",
  },
  {
    title: "Settings",
    description: "Connect Gmail and Google Calendar via OAuth. Set OpenRouter API key for AI. Add your email signature.",
    icon: "🔐",
  },
];

export default async function MarketingPage() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#f2f2f2]">
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 pb-24 pt-10 sm:px-8 lg:px-10 lg:pt-12">
        {/* Navbar */}
        <header className="sticky top-0 z-30 -mx-5 mb-16 border-b border-[rgba(255,255,255,0.06)] bg-[#0e0e0e]/90 px-5 py-5 backdrop-blur sm:mx-0 sm:px-0">
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff4000] text-white">
                <RippleLogo className="h-5 w-5" />
              </span>
              <span className="text-xl font-semibold tracking-tight text-[#f2f2f2]">
                Rippl
              </span>
            </Link>
            <div className="hidden items-center gap-8 text-sm font-medium text-[#888] md:flex">
              <a href="#features" className="hover:text-[#f2f2f2] transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-[#f2f2f2] transition-colors">
                How it works
              </a>
              <a href="#free" className="hover:text-[#f2f2f2] transition-colors">
                100% Free
              </a>
              <a href="#faq" className="hover:text-[#f2f2f2] transition-colors">
                FAQ
              </a>
            </div>
            <div className="flex items-center gap-3">
              {!isSignedIn && (
                <Link
                  href="/sign-in"
                  className="hidden text-sm font-medium text-[#888] hover:text-[#f2f2f2] md:inline transition-colors"
                >
                  Log in
                </Link>
              )}
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#ff4000] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e63900]"
              >
                {isSignedIn ? "Go to Dashboard" : "Get Started"}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
            </div>
          </nav>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-28 sm:gap-32">
          {/* Hero */}
          <section className="grid items-center gap-16 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:gap-20">
            <div className="space-y-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#161616] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#888]">
                <span className="text-[#ff4000]">✦</span>
                <span>Smart group emailing, reimagined</span>
              </div>
              <div className="space-y-5">
                <h1 className="text-4xl font-semibold tracking-tight text-[#f2f2f2] sm:text-5xl lg:text-6xl">
                  One place for every
                  <br />
                  message your team needs.
                </h1>
                <p className="max-w-xl text-base leading-relaxed text-[#888] sm:text-lg">
                  Rippl lets you organize contacts into groups and reach everyone
                  instantly — bulk emails, calendar events, reminders, and
                  AI-assisted writing. No copy-pasting. Ever again.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.06)] bg-[#161616] px-4 py-1.5 text-xs font-medium text-[#4a4a4a]">
                <span>Compose once as an</span>
                <AnimatedType />
              </div>

              <div className="flex flex-wrap items-center gap-5">
                <Link
                  href={isSignedIn ? "/dashboard" : "/sign-up"}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#ff4000] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e63900]"
                >
                  {isSignedIn ? "Go to Dashboard" : "Start for free"}
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.12)] bg-[#161616] px-5 py-2.5 text-sm font-semibold text-[#f2f2f2] transition hover:bg-[#1e1e1e]"
                >
                  See how it works
                </a>
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#4a4a4a] pt-1">
                Built for organizers, community leads, and teams. 100% free.
              </p>
            </div>

            {/* Hero visual — simple, spacious */}
            <div className="relative flex justify-center items-start">
              <div className="w-full max-w-md rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#161616] shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[13px] text-[#888]">New Email</span>
                </div>
                <div className="p-8 sm:p-10 space-y-6">
                  <div>
                    <p className="text-[12px] text-[#4a4a4a] mb-2">Subject</p>
                    <div className="h-4 rounded-lg bg-[#1e1e1e] max-w-[85%]" />
                  </div>
                  <div>
                    <p className="text-[12px] text-[#4a4a4a] mb-2">Message</p>
                    <div className="space-y-2">
                      <div className="h-3 rounded bg-[#1e1e1e]/80 w-full" />
                      <div className="h-3 rounded bg-[#1e1e1e]/80 w-[90%]" />
                      <div className="h-3 rounded bg-[#1e1e1e]/80 w-3/4" />
                    </div>
                  </div>
                  <div className="pt-2 flex items-center justify-between gap-4">
                    <div className="flex gap-2">
                      <div className="h-8 w-20 rounded-lg bg-[#1e1e1e]" />
                      <div className="h-8 w-24 rounded-lg bg-[#ff4000]/20" />
                    </div>
                    <div className="h-9 w-24 rounded-lg bg-[#ff4000]" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Social proof */}
          <section className="space-y-4 py-4 text-center text-sm text-[#4a4a4a]">
            <p>For community leads, organizers, and event managers</p>
          </section>

          {/* Features */}
          <section id="features" className="space-y-12">
            <div className="space-y-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4a4a4a]">
                Everything in one place
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-[#f2f2f2] sm:text-3xl">
                What you get in Rippl
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <FeatureCard
                  key={f.title}
                  icon={f.icon}
                  title={f.title}
                  description={f.description}
                />
              ))}
            </div>
          </section>

          {/* How it works */}
          <section
            id="how-it-works"
            className="space-y-12 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#161616] p-10 sm:p-14"
          >
            <div className="space-y-4 text-left sm:text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4a4a4a]">
                How it works
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-[#f2f2f2]">
                From idea to inbox in three steps.
              </h2>
            </div>
            <ol className="grid gap-10 text-sm text-[#888] md:grid-cols-3">
              <li className="relative space-y-3">
                <StepNumber>1</StepNumber>
                <p className="font-semibold text-[#f2f2f2]">
                  Create a group and add your contacts
                </p>
                <p>
                  Import from CSV or add people manually. Use emojis and names
                  that match how you think about your teams.
                </p>
              </li>
              <li className="relative space-y-3">
                <StepNumber>2</StepNumber>
                <p className="font-semibold text-[#f2f2f2]">
                  Write your message (or let AI draft it)
                </p>
                <p>
                  Start from templates for meetings, announcements, and
                  reminders — or describe what you need and let AI write it.
                </p>
              </li>
              <li className="relative space-y-3">
                <StepNumber>3</StepNumber>
                <p className="font-semibold text-[#f2f2f2]">
                  Send, schedule, or create a calendar event
                </p>
                <p>
                  Hit send now, pick a future time, or turn it into a Google
                  Calendar invite with one click.
                </p>
              </li>
            </ol>
          </section>

          {/* Testimonial */}
          <section className="space-y-8 text-center">
            <div className="mx-auto max-w-2xl rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#161616] px-8 py-14 sm:px-10">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#4a4a4a]">
                What organizers are saying
              </p>
              <figure className="mt-6 space-y-6">
                <blockquote className="text-xl font-medium leading-relaxed text-[#f2f2f2] sm:text-2xl">
                  “I used to spend 20 minutes copy-pasting emails for every
                  meeting. Rippl cut that to 30 seconds.”
                </blockquote>
                <figcaption className="text-sm text-[#888]">
                  — Community Lead, GDG on Campus
                </figcaption>
              </figure>
            </div>
          </section>

          {/* 100% Free — replaces Pricing */}
          <section id="free" className="space-y-8 text-center">
            <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#161616] px-8 py-16 sm:px-12 sm:py-20">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ff4000]">
                100% Free
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#f2f2f2] sm:text-3xl">
                No credit card. No limits. No paywall.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-[#888]">
                Rippl is free for organizers and teams. Create groups, send
                emails, schedule sends, create calendar events, use AI drafting,
                and manage reminders — all at no cost.
              </p>
              <Link
                href={isSignedIn ? "/dashboard" : "/sign-up"}
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#ff4000] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e63900]"
              >
                {isSignedIn ? "Go to Dashboard" : "Create your free account"}
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="space-y-12">
            <div className="space-y-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4a4a4a]">
                FAQ
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-[#f2f2f2] sm:text-3xl">
                Answers to common questions.
              </h2>
            </div>
            <div className="space-y-4">
              {faqs.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#161616] p-5 sm:p-6 text-left transition"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[#f2f2f2]">
                    <span>{item.q}</span>
                    <span className="text-[#4a4a4a] transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed text-[#888]">{item.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#161616] px-8 py-16 text-center sm:px-12 sm:py-20">
            <p className="text-2xl font-semibold tracking-tight text-[#f2f2f2] sm:text-3xl">
              Stop copy-pasting. Start signaling.
            </p>
            <p className="mt-5 text-sm leading-relaxed text-[#888]">
              {isSignedIn
                ? "Head to your dashboard and send your next update."
                : "Create your free account and send your next update in under a minute."}
            </p>
            <Link
              href={isSignedIn ? "/dashboard" : "/sign-up"}
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#ff4000] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e63900]"
            >
              {isSignedIn ? "Go to Dashboard" : "Create your free account"}
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </section>
        </main>

        {/* Footer */}
        <footer className="mt-20 border-t border-[rgba(255,255,255,0.06)] pt-10 pb-4 text-xs text-[#4a4a4a]">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#ff4000] text-white">
                <RippleLogo className="h-4 w-4" />
              </span>
              <span className="font-semibold text-[#f2f2f2]">Rippl</span>
              <span className="text-[#4a4a4a]">·</span>
              <span>© 2025 Rippl</span>
              <span className="text-[#4a4a4a]">·</span>
              <span>100% free</span>
            </div>
            <div className="flex gap-4 text-xs">
              <Link href="/privacy" className="hover:text-[#888] transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-[#888] transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <article className="flex flex-col justify-between rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#161616] p-6 text-left transition hover:border-[rgba(255,255,255,0.1)]">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <h3 className="text-sm font-semibold text-[#f2f2f2]">{title}</h3>
        </div>
        <p className="text-sm leading-relaxed text-[#888]">{description}</p>
      </div>
    </article>
  );
}

function StepNumber({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(255,255,255,0.12)] bg-[#1e1e1e] text-xs font-semibold text-[#f2f2f2]">
      {children}
    </div>
  );
}

function AnimatedType() {
  const items = [
    "email blast",
    "event invite",
    "scheduled reminder",
    "AI-written draft",
  ];

  return (
    <span className="relative inline-flex h-5 w-40 overflow-hidden">
      <span className="absolute inset-0 animate-rippl-type">
        {items.map((item, idx) => (
          <span
            key={item}
            className="flex h-5 items-center justify-start text-[11px] font-semibold text-[#f2f2f2]"
            style={{ animationDelay: `${idx * 4}s` }}
          >
            {item}
          </span>
        ))}
      </span>
    </span>
  );
}
