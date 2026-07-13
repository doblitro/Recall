# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: unfamiliar Next.js version

This repo runs Next.js 16.2.10, which has breaking changes vs. older versions you may know from training data (App Router conventions, config, APIs). Before writing Next.js-specific code, check `node_modules/next/dist/docs/` for the current behavior — don't assume.

## Commands

- `npm run dev` — start dev server on port 4000
- `npm run build` — production build
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)
- `npm run typecheck` — `tsc --noEmit`
- `npm run format` / `npm run format:check` — Prettier (with `prettier-plugin-tailwindcss` for class sorting)
- `npx prisma generate` — regenerate Prisma client (also runs automatically on `npm install` via `postinstall`)
- `npx prisma migrate dev` — create/apply a migration during local development
- `npm run cf:build` / `npm run cf:preview` / `npm run cf:deploy` — build/preview/deploy to Cloudflare Workers via OpenNext

A Husky pre-commit hook runs `lint-staged` (ESLint --fix + Prettier) on staged files automatically — no need to manually format before committing.

No test suite exists yet.

## Architecture

Recall is a personal search tool that connects to third-party accounts (Gmail, Google Drive, ...) and lets a user search across them from one place. It's a Next.js App Router app deployed to Cloudflare Workers via `@opennextjs/cloudflare`.

### Runtime target: Cloudflare Workers, not Node

- Prisma uses the `workerd` runtime + `@prisma/adapter-neon` (driver adapter over Neon's HTTP/WebSocket protocol), generated into `app/generated/prisma/` (not `node_modules/.prisma`) — see `prisma/schema.prisma`.
- `lib/prisma/client.ts` deliberately builds a **new** `PrismaClient` per call instead of a module-level singleton: Workers reuses module scope across unrelated requests, so a shared client would leak one request's I/O handles into another's and throw. Always call `getPrismaClient()` fresh where needed rather than hoisting it.
- Google API calls use plain `fetch` rather than `googleapis`/`gaxios` client libraries, to stay compatible with the Workers runtime.

### Connector plugin architecture

Adding a new data source (beyond Gmail/Google Drive) means implementing the `ConnectorProvider` interface (`lib/connectors/types.ts`) and registering it in `lib/connectors/providers/index.ts`:

- `lib/connectors/types.ts` — the `ConnectorProvider` contract: `getAuthUrl`, `exchangeCodeForTokens`, `refreshAccessToken`, `revoke`, plus declared `scopes`/`requiredEnvVars`.
- `lib/connectors/providers/*.ts` — one file per provider implementing that contract (`gmail.ts`, `google-drive.ts`), built on shared helpers in `lib/connectors/google-oauth-client.ts` (raw-fetch Google OAuth: auth URL, token exchange, refresh, revoke, userinfo).
- `lib/connectors/registry.ts` — looks up a provider by id (`getProvider`).
- `lib/connectors/public.ts` — provider ids/labels safe to reference from client code.
- `app/api/connectors/[provider]/{connect,callback,disconnect,status}/route.ts` — generic OAuth flow driven entirely by the registry; these routes don't know about specific providers, only the `ConnectorProvider` interface. OAuth state is CSRF-protected via a short-lived signed cookie (`lib/connectors/oauth-state.ts`).
- `lib/connectors/token.ts` — `getValidAccessToken` transparently refreshes a token if it's within `REFRESH_BUFFER_MS` (60s) of expiring, persisting the refreshed token back to the `Integration` row.
- `lib/connectors/search-route.ts` — two route factories, both handling session/user lookup so provider routes only implement the Google-API-specific part:
  - `createSearchRoute()` fans a search out across every connected account for that provider via `Promise.allSettled`, merging results and surfacing per-account failures as `SearchErrorEntry[]` instead of failing the whole request (see `app/api/connectors/gmail/messages/route.ts`). Provider `search()` functions are expected to page through the underlying API's own pagination (`nextPageToken`/`pageToken`) up to a `MAX_RESULTS_PER_ACCOUNT` cap rather than returning only the first page.
  - `createDetailRoute()` fetches a single item's full detail for one connected account (see `app/api/connectors/gmail/messages/[id]/route.ts`).

### Data model

Single Postgres schema (`prisma/schema.prisma`): `User` 1—many `Integration`. An `Integration` row is one connected account for one provider (unique on `[provider, providerAccountId]`), holding that account's OAuth tokens and expiry. A user can connect multiple accounts of the same provider.

### Frontend conventions

- Client components go under `app/components/<feature>/`; copy `app/components/_template/Component.template.tsx` as a starting point.
- `app/hooks/useConnectorSearch.ts` is the shared client-side data-fetching hook for connector search endpoints (keyed by `itemsKey` matching the API response shape from `createSearchRoute`).
- Per-provider result hooks (`app/components/gmail/useGmailResults.tsx`, `app/components/drive/useDriveResults.tsx`) each own their row-expansion state and return `MergedResultItem[]` (`app/components/results/types.ts`) — `{ id, provider, updatedAt?, card }`, where `card` is an already-rendered `<ResultCard>` element, not raw row data. `app/components/ui/Main.tsx` merges the per-provider arrays, dedupes by `` `${provider}:${id}` `` (the same underlying item can come back from more than one connected account), and sorts by `updatedAt` descending. `app/components/ui/ResultsContainer.tsx` renders a slice of that merged list with a "Load more" button rather than rendering everything at once.
