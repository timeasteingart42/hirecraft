# HireCraft

> AI tools to land your next job faster. Job Match, Cover Letter, Resume Tailor, Interview Prep, Positioning Statement, Market-Specific Documents, Job Tracker.

## What is in this repo

Monorepo with two Next.js apps:
- `apps/web` — Marketing site (hirecraft.vercel.app or your custom domain)
- `apps/app` — Application (app.hirecraft.vercel.app)

Shared package:
- `packages/db` — Prisma schema and client

## Quick start (local dev)

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys (see below)

# 3. Initialize database
cd packages/db
pnpm prisma migrate dev --name initial
cd ../..

# 4. Run both apps
pnpm dev
```

- Marketing site: http://localhost:3000
- App: http://localhost:3001

## Deployment (free tier)

### Prerequisites (accounts to create, all free)

1. **Vercel** (free hobby plan): https://vercel.com/signup
2. **Neon** (free Postgres): https://neon.tech/signup
3. **Clerk** (free tier, 10k MAU): https://dashboard.clerk.com/sign-up
4. **Anthropic** (pay-per-use API): https://console.anthropic.com

### Deployment steps

1. **Push to GitHub:**
   ```bash
   cd ~/Documents/Claude/Projects/HireCraft
   git init
   git add .
   git commit -m "Initial commit"
   # Create GitHub repo, then:
   git remote add origin https://github.com/YOUR_USERNAME/hirecraft.git
   git push -u origin main
   ```

2. **Create Neon Postgres database:**
   - Sign up at neon.tech
   - Create project "hirecraft"
   - Copy the connection string (starts with `postgresql://`)

3. **Set up Clerk:**
   - Sign up at clerk.com
   - Create application "HireCraft"
   - Copy Publishable Key and Secret Key from dashboard

4. **Deploy marketing site to Vercel:**
   - New Project → Import your GitHub repo
   - Root Directory: `apps/web`
   - Framework: Next.js
   - Environment variables: `NEXT_PUBLIC_APP_URL=https://hirecraft-app.vercel.app`
   - Deploy
   - You get: `hirecraft-web.vercel.app`

5. **Deploy app to Vercel:**
   - New Project → Import same GitHub repo
   - Root Directory: `apps/app`
   - Framework: Next.js
   - Environment variables (set all from `.env.example`):
     - `DATABASE_URL` = your Neon connection string
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = from Clerk
     - `CLERK_SECRET_KEY` = from Clerk
     - `ANTHROPIC_API_KEY` = your existing key
     - `NEXT_PUBLIC_APP_URL=https://hirecraft-app.vercel.app`
     - `NEXT_PUBLIC_WEB_URL=https://hirecraft-web.vercel.app`
   - Build command: `pnpm build`
   - Deploy
   - You get: `hirecraft-app.vercel.app`

6. **Run production migrations:**
   ```bash
   # Locally with production DATABASE_URL:
   DATABASE_URL="your-neon-prod-url" pnpm prisma migrate deploy
   ```

7. **Done.** Visit `hirecraft-web.vercel.app` to see the marketing site.

## Roadmap (what is in this MVP vs. what is coming)

**Shipped in this MVP:**
- ✅ Marketing homepage with feature grid
- ✅ App shell with auth
- ✅ Resume upload and baseline storage
- ✅ Application creation flow
- ✅ AI Module 1: Match Insights (deterministic keyword + LLM narrative)
- ✅ AI Module 2: Cover Letter Generator
- ✅ Application detail page with 2 tabs
- ✅ Job tracker (basic list view)

**Weeks 2-3 (add next):**
- Resume Tailoring (Module 3)
- Interview Prep (Module 4)
- Inline Editor (Module 6)

**Weeks 4-6:**
- Positioning Statement (Module 7)
- Market-Specific Documents (Module 8, 5 types)
- Improve My Resume (Module 5)
- Stripe subscription (currently: all features free during beta)

**Weeks 7-8:**
- PDF/DOCX export
- Compare pages (vs ChatGPT, vs Teal)
- SEO content pages
- Legal pages (privacy, terms, cookies)

## Cost at scale (rough)

- **First 100 users:** ~$0/month (all free tiers)
- **100-1000 users:** ~$40/month (Vercel Pro + Neon Scale)
- **1000+ users:** depends on API usage; Anthropic costs ~$2-5 per active user per month

## Repository structure

See `docs/BUILD.md` for the full architectural spec that generated this codebase.
