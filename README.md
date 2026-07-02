# Rental Scout

A mobile-first rental property scouting dashboard with HELOC-aware deal analysis, persistent storage, account isolation, ranking, and trip planning.

## Run locally

1. Install dependencies: `pnpm install`
2. Copy `.env.example` to `.env.local`.
3. Add your Supabase project URL and anon key.
4. Paste `supabase/schema.sql` into the Supabase SQL editor and run it.
5. Start the app: `pnpm dev`

If the two Supabase environment values are omitted, the app starts in local mode and stores records in this browser using localStorage. Local records are intentionally separate from Supabase records.

## Supabase authentication

Enable the Email provider in **Authentication → Providers**. Supabase email confirmation behavior follows the setting in your project. Add your deployed application URL to the Supabase redirect allow list before production use.

## Commands

- `pnpm dev` — development server
- `pnpm test` — calculation tests
- `pnpm build` — TypeScript and production build
