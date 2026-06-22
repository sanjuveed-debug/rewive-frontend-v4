# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Rewive front end — a React/TypeScript dashboard ("Accountability Layer" product) with 6 screens: Command Center, Create an Agent, Runs & Actions, Decision Ledger, People & Agents, and Outcomes. It was scaffolded from a static HTML prototype (`rewive_ui-redesign-prototype_v1.html`, not in this repo) and rebuilt so every data point is fetched from an API instead of hardcoded. No production backend exists yet — a mock Express server in `mock-server/` stands in for it, seeded with the prototype's original data, implementing the exact REST contract the frontend expects.

## Commands

```bash
npm run dev          # Vite dev server only (frontend on :5173, proxies /api -> :4000)
npm run mock-server   # Mock Express API only (:4000)
npm run dev:all       # Both together (concurrently) — use this for local development
npm run build         # tsc -b && vite build (type-checks, then builds to dist/)
npm run lint          # eslint .
npm run preview       # Preview the production build
```

There is no test suite configured. There is no single-test command since none exists yet.

## Architecture

**Data flow:** every screen is wired to the backend through TanStack Query. There is no hardcoded UI data — if a screen needs something, it goes through a hook in `src/api/`.

- `src/api/client.ts` — single axios instance, base URL from `VITE_API_BASE_URL` (set in `.env`, defaults to `/api/v1`).
- `src/api/types.ts` — the shared TypeScript contract for every API resource (KPIs, runs, decisions, leaderboard rows, outcome reports, agent builder messages, etc). This file is the source of truth for API shapes — check here before changing a request/response shape anywhere.
- `src/api/{dashboard,runs,decisions,people,outcomes,agentBuilder}.ts` — one module per domain, each exporting `useQuery`/`useMutation` hooks (e.g. `useDashboardSummary`, `useApproveDecision`, `useAssignAction`). Screens import these hooks directly; there is no separate "service" or "repository" layer.
- Mutations follow a consistent pattern: optimistic cache update or `queryClient.invalidateQueries` in `onSuccess`, paired with a toast via `useToast()` (`src/components/shared/Toast.tsx`) called from the screen component, not from the hook.
- Live/polling data (e.g. `useLiveRuns`, `useRunDetail`) uses React Query's `refetchInterval` rather than websockets.

**Routing:** `src/App.tsx` sets up `BrowserRouter` + `QueryClientProvider` + `ToastProvider`. One route per screen under `AppLayout` (`src/components/layout/AppLayout.tsx`, which renders `Sidebar` + `Topbar` + an `<Outlet />`). `/outcomes` redirects to `/outcomes/latest`; the Outcomes screen is the only one parameterized by an ID (`runId`).

**Screens:** each screen lives in `src/screens/<Name>/` with an `index.tsx` as the entry point and sibling components for sub-sections (e.g. `Decisions/StatsRow.tsx`, `Decisions/DecisionsTable.tsx`). Filter state (status chips, function/verdict filters) is local `useState` in the screen `index.tsx`, passed down as props/query params — there is no global filter store.

**Styling:** one global stylesheet, `src/styles/globals.css`, ported near-verbatim from the original HTML prototype (CSS variables in `:root`, utility classes like `.card`, `.pill`, `.btn`, `.agent-chip`, table styles). There is no CSS-in-JS or Tailwind — new UI should reuse these existing classes rather than introducing a new styling approach. Shared small components (`Avatar`, `Pill`, `Sparkline`, `Toast`, `StateMessage`) live in `src/components/shared/` and just apply these classes with props.

**Mock API (`mock-server/`):** a standalone Express app (`server.js`) with in-memory seed data (`data.js`) mirroring the original prototype's numbers. It implements the full REST contract under `/api/v1/...` including stateful mutations (approving a decision removes it from `/decisions/pending`, assigning an outcome action flips its `assigned` flag, creating an agent transitions its preview from `draft` to `live`). When extending the frontend with a new data point, add the corresponding seed data + route here first, matching the shape in `src/api/types.ts`.

**Agent Builder flow** (`/create`, `src/screens/CreateAgent/`) is the most stateful screen: a client-generated `sessionId` (via `crypto.randomUUID()`) drives a chat session (`useAgentBuilderSession`), capability/data-context toggles (`useToggleSelection`), and a draft preview (`useSessionPreview`) that becomes a live `AgentPreview` (`useAgentPreview`) once `useCreateAgent` succeeds. The mock server's bot replies are currently canned/static, not real NLU — a real backend integration is the main gap here.

## Conventions

- Path imports are relative (no `@/` alias configured) — e.g. `../../api/dashboard`.
- New API resources: define the type in `src/api/types.ts`, the hook in the relevant `src/api/<domain>.ts`, and the mock route + seed data in `mock-server/`.
- Vite dev server proxies `/api` to `http://localhost:4000` (see `vite.config.ts`) — don't hardcode the mock server port elsewhere.
