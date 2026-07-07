# HireCraft — Setup Guide

This is what you do to go from the code in this repo to a live product.

## Step 1: Install dependencies locally (5 minutes)

```bash
cd ~/Documents/Claude/Projects/HireCraft
brew install pnpm     # if not installed
pnpm install
```

This installs Next.js, Prisma, Clerk, Anthropic SDK, and everything else.

## Step 2: Create free accounts (15 minutes)

Open each and sign up. Copy each set of keys into `.env.local` (which you create from `.env.example`).

1. **Neon Postgres** (database) — https://neon.tech
   - Sign up with GitHub
   - Create project "hirecraft"
   - Copy the pooled connection string → `DATABASE_URL`

2. **Clerk** (authentication) — https://dashboard.clerk.com
   - Sign up with GitHub
   - Create application "HireCraft"
   - Enable Email + Google + LinkedIn OAuth
   - Copy Publishable Key → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Copy Secret Key → `CLERK_SECRET_KEY`

3. **Anthropic** (AI) — https://console.anthropic.com
   - You already have this. Copy your key → `ANTHROPIC_API_KEY`

4. **Vercel** (hosting) — https://vercel.com
   - Sign up with GitHub

## Step 3: Configure environment

```bash
cd ~/Documents/Claude/Projects/HireCraft
cp .env.example .env.local
# Edit .env.local with your actual keys
```

For local dev, keep `NEXT_PUBLIC_APP_URL=http://localhost:3001` and `NEXT_PUBLIC_WEB_URL=http://localhost:3000`.

## Step 4: Initialize database

```bash
cd packages/db
DATABASE_URL="your-neon-url" npx prisma migrate dev --name initial
DATABASE_URL="your-neon-url" npx prisma generate
```

This creates all the tables (User, ResumeBaseline, Application, Document, UsageEvent).

## Step 5: Run locally

```bash
cd ~/Documents/Claude/Projects/HireCraft
pnpm dev
```

- Marketing site: http://localhost:3000
- Application: http://localhost:3001

Sign up on the app, upload a resume (paste text), create an application (paste a job posting), see the Match Insights and generate a Cover Letter.

## Step 6: Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   cd ~/Documents/Claude/Projects/HireCraft
   git init
   git add .
   git commit -m "Initial HireCraft build"
   # Create a new GitHub repo, then:
   git remote add origin https://github.com/YOUR/hirecraft.git
   git push -u origin main
   ```

2. **Deploy marketing site:**
   - New Project in Vercel
   - Import your GitHub repo
   - Root Directory: `apps/web`
   - Build Command: leave default
   - Environment Variables:
     - `NEXT_PUBLIC_APP_URL=https://hirecraft-app.vercel.app` (or your subdomain)
   - Deploy
   - Result: `hirecraft-web.vercel.app`

3. **Deploy application:**
   - New Project in Vercel
   - Import same GitHub repo
   - Root Directory: `apps/app`
   - Build Command: `cd ../../packages/db && npx prisma generate && cd ../../apps/app && next build`
   - Environment Variables (all from your `.env.local`):
     - `DATABASE_URL`
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`
     - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
     - `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
     - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard`
     - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard`
     - `ANTHROPIC_API_KEY`
     - `ANTHROPIC_MODEL=claude-sonnet-5`
     - `NEXT_PUBLIC_APP_URL=https://hirecraft-app.vercel.app`
     - `NEXT_PUBLIC_WEB_URL=https://hirecraft-web.vercel.app`
   - Deploy
   - Result: `hirecraft-app.vercel.app`

4. **Update Clerk redirect URLs:**
   - In Clerk dashboard → Domains → Add production domain: `hirecraft-app.vercel.app`

## Done

You now have:
- Marketing site at `hirecraft-web.vercel.app`
- Application at `hirecraft-app.vercel.app`
- Free tier on all services
- All features from the current build shipped

Total time investment: about 40 minutes if all accounts work smoothly.

## What is not shipped yet (roadmap in `README.md`)

The MVP includes Match Insights and Cover Letter. The other 5 modules (Resume Tailor, Interview Prep, Positioning Statement, Market-Specific Docs, Improve My Resume) will be added in subsequent weeks per the spec in `BEHIRED-CLONE-BUILD.md`. The full API route structure is set up so adding them means: (1) write the system prompt in `apps/app/lib/prompts/`, (2) create the API route in `apps/app/app/api/ai/`, (3) add the tab component in `apps/app/app/applications/[id]/`.

Each new module takes 2 to 4 hours to add.
