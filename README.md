# Rewive Front End

React + TypeScript + Vite front end for Rewive, the "Accountability Layer" dashboard. Six screens — Command Center, Create an Agent, Runs & Actions, Decision Ledger, People & Agents, and Outcomes — all backed by a typed REST API contract (see `src/api/types.ts`).

A mock Express API (`mock-server/`) seeded with representative data implements that contract end-to-end, so the app runs fully without a real backend.

## Getting started

```bash
npm install
cp .env.example .env
npm run dev:all   # runs the Vite dev server (:5173) and mock API (:4000) together
```

Open http://localhost:5173.

## Scripts

```bash
npm run dev          # Vite dev server only
npm run mock-server   # mock Express API only
npm run dev:all       # both, concurrently
npm run build         # type-check + production build
npm run lint          # eslint
npm run preview       # preview the production build
```

See `CLAUDE.md` for architecture notes.
