export default function Home() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "#";

  return (
    <main className="max-w-6xl mx-auto px-6">
      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-widest text-brand mb-4">
            Purpose-built for job applications
          </div>
          <h1 className="font-serif text-5xl md:text-6xl leading-tight tracking-tight mb-6">
            Match, tailor, apply.
            <br />
            <span className="text-brand">Land your next job faster.</span>
          </h1>
          <p className="text-xl text-neutral-500 mb-10 max-w-2xl leading-relaxed">
            HireCraft is a purpose-built AI toolkit for job seekers. Job match analysis,
            tailored cover letters, targeted resumes, interview prep, and application
            tracking. In your voice. On your terms.
          </p>
          <div className="flex items-center gap-4">
            <a
              href={`${appUrl}/sign-up`}
              className="inline-flex items-center px-6 py-3 bg-brand text-paper text-base font-medium rounded hover:bg-brand-dark transition-colors"
            >
              Start free
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center px-6 py-3 border border-neutral-200 text-base rounded hover:border-brand hover:text-brand transition-colors"
            >
              See how it works
            </a>
          </div>
          <div className="mt-6 text-sm text-neutral-500">
            No credit card required. Bring your own Anthropic key or start on us.
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="how-it-works" className="py-16 border-t border-neutral-200">
        <div className="mb-12">
          <div className="text-xs uppercase tracking-widest text-brand mb-2">
            The toolkit
          </div>
          <h2 className="font-serif text-3xl md:text-4xl tracking-tight">
            Everything you need to apply well.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            title="Job Match Score"
            description="Paste a job posting. See exactly how you match on requirements, keywords, and fit. Actionable gaps."
            href="/job-apply/job-match"
          />
          <FeatureCard
            title="Cover Letter"
            description="Tailored to the role, in your voice, without generic openers. Export PDF or DOCX."
            href="/cover-letter-generator"
          />
          <FeatureCard
            title="Resume Builder"
            description="Bring your experience. Get a role-specific resume that surfaces the right achievements."
            href="/resume/builder"
          />
          <FeatureCard
            title="Interview Prep"
            description="Likely questions with sample answers based on your background and the role."
            href="/job-apply/interview"
          />
          <FeatureCard
            title="Positioning Statement"
            description="A tailored positioning line for cover letters, LinkedIn, conference bios, and applications."
            href="/job-apply/positioning-statement"
          />
          <FeatureCard
            title="Job Tracker"
            description="Every application, every status, every deadline, in one clean list."
            href="/job-tracker"
          />
        </div>
      </section>

      {/* Positioning */}
      <section className="py-20 border-t border-neutral-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <div className="text-xs uppercase tracking-widest text-brand mb-3">
              Why HireCraft
            </div>
            <h3 className="font-serif text-3xl tracking-tight mb-6">
              Built for the application itself.
            </h3>
            <p className="text-neutral-500 text-lg leading-relaxed">
              Generic AI chatbots do many things badly. HireCraft does one thing well:
              help you produce a strong application, faster. Every feature is tuned for
              real hiring workflows. No cheerleading, no hallucinated credentials, no
              filler.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <Principle
              number="01"
              title="Your voice, not ours."
              body="We generate drafts you can defend. If you did not do it, it will not appear."
            />
            <Principle
              number="02"
              title="Explainable matching."
              body="Deterministic keyword extraction plus a narrative fit analysis. See exactly why we said what we said."
            />
            <Principle
              number="03"
              title="ATS-aware."
              body="Every resume export is optimized for parsing systems used by real employers."
            />
          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="py-20 border-t border-neutral-200">
        <div className="max-w-2xl">
          <h3 className="font-serif text-3xl tracking-tight mb-4">Start applying smarter.</h3>
          <p className="text-neutral-500 text-lg mb-8">
            Free during beta. All features unlocked while we build.
          </p>
          <a
            href={`${appUrl}/sign-up`}
            className="inline-flex items-center px-6 py-3 bg-brand text-paper text-base font-medium rounded hover:bg-brand-dark transition-colors"
          >
            Create your account
          </a>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="block p-6 bg-neutral-50 border border-neutral-200 rounded hover:border-brand transition-colors group"
    >
      <h3 className="font-serif text-xl mb-2 group-hover:text-brand transition-colors">
        {title}
      </h3>
      <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>
    </a>
  );
}

function Principle({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="font-mono text-xs text-brand mb-1">{number}</div>
      <h4 className="font-serif text-lg mb-1">{title}</h4>
      <p className="text-sm text-neutral-500 leading-relaxed">{body}</p>
    </div>
  );
}
