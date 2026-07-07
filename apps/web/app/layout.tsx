import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HireCraft — AI tools to land your next job faster",
  description:
    "Match, tailor, apply. HireCraft is a purpose-built AI toolkit for job seekers: fit analysis, cover letters, resumes, interview prep, and application tracking.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000"),
  openGraph: {
    title: "HireCraft — AI tools to land your next job faster",
    description:
      "Purpose-built AI for job applications. Not a generic chatbot.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}

function Header() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "#";
  return (
    <header className="border-b border-neutral-200 bg-paper/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/" className="font-serif text-2xl tracking-tight">
          HireCraft
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <a href="/cover-letter-generator" className="hover:text-brand transition-colors">
            Cover letter
          </a>
          <a href="/job-apply/job-match" className="hover:text-brand transition-colors">
            Job match
          </a>
          <a href="/resume/builder" className="hover:text-brand transition-colors">
            Resume
          </a>
          <a href="/job-apply/interview" className="hover:text-brand transition-colors">
            Interview
          </a>
          <a href="/pricing" className="hover:text-brand transition-colors">
            Pricing
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <a
            href={`${appUrl}/sign-in`}
            className="text-sm hover:text-brand transition-colors"
          >
            Sign in
          </a>
          <a
            href={`${appUrl}/sign-up`}
            className="text-sm px-4 py-2 bg-brand text-paper rounded hover:bg-brand-dark transition-colors"
          >
            Start free
          </a>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-neutral-200 mt-24">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="font-serif text-xl mb-3">HireCraft</div>
          <div className="text-neutral-500">
            AI tools to land your next job faster.
          </div>
        </div>
        <div>
          <div className="font-medium mb-3">Product</div>
          <ul className="space-y-2 text-neutral-500">
            <li>
              <a href="/cover-letter-generator" className="hover:text-brand">
                Cover letter
              </a>
            </li>
            <li>
              <a href="/job-apply/job-match" className="hover:text-brand">
                Job match
              </a>
            </li>
            <li>
              <a href="/resume/builder" className="hover:text-brand">
                Resume builder
              </a>
            </li>
            <li>
              <a href="/job-apply/interview" className="hover:text-brand">
                Interview prep
              </a>
            </li>
            <li>
              <a href="/job-tracker" className="hover:text-brand">
                Job tracker
              </a>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-medium mb-3">Company</div>
          <ul className="space-y-2 text-neutral-500">
            <li>
              <a href="/pricing" className="hover:text-brand">
                Pricing
              </a>
            </li>
            <li>
              <a href="/compare/hirecraft-vs-chatgpt" className="hover:text-brand">
                vs ChatGPT
              </a>
            </li>
            <li>
              <a href="/contact" className="hover:text-brand">
                Contact
              </a>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-medium mb-3">Legal</div>
          <ul className="space-y-2 text-neutral-500">
            <li>
              <a href="/privacy_policy" className="hover:text-brand">
                Privacy
              </a>
            </li>
            <li>
              <a href="/cookie_policy" className="hover:text-brand">
                Cookies
              </a>
            </li>
            <li>
              <a href="/terms" className="hover:text-brand">
                Terms
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-6 text-xs text-neutral-500 flex justify-between">
          <span>© 2026 HireCraft.</span>
          <span>Made for job seekers worldwide.</span>
        </div>
      </div>
    </footer>
  );
}
