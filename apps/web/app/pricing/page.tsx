export default function Pricing() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "#";
  return (
    <main className="max-w-4xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <div className="text-xs uppercase tracking-widest text-brand mb-3">Pricing</div>
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-4">
          One plan. Everything included.
        </h1>
        <p className="text-lg text-neutral-500">
          Free during beta while we finish the last modules.
        </p>
      </div>

      <div className="border border-neutral-200 rounded-lg p-10 bg-neutral-50 max-w-2xl mx-auto">
        <div className="text-xs uppercase tracking-widest text-brand mb-2">Pro plan</div>
        <div className="flex items-baseline gap-2 mb-6">
          <span className="font-serif text-5xl">$0</span>
          <span className="text-neutral-500">/month during beta</span>
        </div>
        <div className="text-sm text-neutral-500 mb-8">
          Launch pricing after beta: $26/month (US), €19.99/month (EU), £12.99/month (UK).
        </div>
        <ul className="space-y-3 mb-8">
          {[
            "Unlimited job applications",
            "AI-powered cover letters in your voice",
            "Job match score with actionable gaps",
            "Tailored resumes, ATS-friendly",
            "Interview prep with likely questions",
            "Positioning statement generator",
            "Job tracker with status history",
            "PDF and DOCX export",
            "Priority support during beta",
          ].map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm">
              <span className="text-brand mt-0.5">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <a
          href={`${appUrl}/sign-up`}
          className="block w-full text-center px-6 py-3 bg-brand text-paper font-medium rounded hover:bg-brand-dark transition-colors"
        >
          Start free
        </a>
      </div>

      <div className="mt-20 max-w-2xl mx-auto">
        <h2 className="font-serif text-2xl tracking-tight mb-6">Frequently asked</h2>
        <div className="space-y-6">
          <FAQ
            q="Do I need a credit card?"
            a="No. During beta everything is free. When we introduce paid tiers you can choose to upgrade or continue on a limited free plan."
          />
          <FAQ
            q="Can I cancel anytime?"
            a="Yes. When paid plans launch you can cancel from your account settings. You keep access until the end of your billing period."
          />
          <FAQ
            q="Is my data private?"
            a="Yes. GDPR-compliant. Your resume and job postings are never used to train models. You can delete your account and all data at any time."
          />
          <FAQ
            q="How is HireCraft different from ChatGPT?"
            a="ChatGPT is a general chatbot. HireCraft is purpose-built for job applications with persistent profiles, structured outputs, ATS-aware formatting, and application tracking. Every feature is tuned for the specific workflow."
          />
        </div>
      </div>
    </main>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-neutral-200 pb-6">
      <h3 className="font-medium mb-2">{q}</h3>
      <p className="text-sm text-neutral-500 leading-relaxed">{a}</p>
    </div>
  );
}
