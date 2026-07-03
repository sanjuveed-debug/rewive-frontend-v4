# Rewive feature inventory — v1 / v2 / v3

Status legend: **Built** = real code, working against the mock API · **Mockup only** = designed as an interactive prototype in chat, not in this codebase · **Partial** = some part built, rest still mockup-only.

## v1 — original prototype

Rebuilt from the static HTML prototype so every data point comes from an API instead of being hardcoded.

| Feature | Status |
|---|---|
| Command Center (KPIs, pending decisions, live runs, pulse) | Built |
| Create an Agent (chat-based builder) | Built |
| Runs & Actions (run list, live run timeline) | Built |
| Decision Ledger (verdict tracking) | Built |
| People & Agents (leaderboard) | Built |
| Outcomes (scorecards, insights, recommended actions) | Built |

## v2 — branch as it stood before today's session

What was already in the codebase when this session started (confirmed by exploring the branch directly, not from memory).

| Feature | Status |
|---|---|
| Top nav restructure — Operate / Build / Insights areas | Built |
| Data Connectors (connector types, approval workflow) | Built |
| Agent Space (agent catalog, filters, detail page) | Built |
| Agent Studio (drag-and-drop, no-code workflow canvas — nodes, simulate, publish) | Built |
| Signal Studio (suggested signals, committee review, KPI tickets) | Built |
| All v1 screens, carried forward | Built |

**Known gap going in:** Create an Agent (chat) and Agent Studio (canvas) were two separate data models (`AgentBuilderSession` vs `AgentWorkflow`), not one spec at two altitudes — this was the core architectural complaint in the design brief and never got resolved this round (see "Not built" below).

## v3 — everything from today's session

### Built and integrated into the app (branch `v3`)

| Feature | Where |
|---|---|
| Signal Detail screen — why a signal was surfaced, impact prognosis, underlying dataset with PII masked by default, similar signals across stores *and* domains with prior-solution outcomes | `/insights/signals/:signalId` |
| Solution Design document — spec (approach, data needed, owner, guardrails), separate from a build | `/build/solutions/:id` |
| Copy-and-tweak — pull a prior similar-signal solution into the current draft | Solution Design screen |
| Task list — new agents to build, existing agents reused, human tasks, each owned and status-tagged | Solution Design screen |
| Validation agent — automated pros/cons/ROI/cost review that **proposes** the dev handoff (or says ready-for-runs), not a manual toggle | Solution Design screen |
| Send for approval → Approve, with status stepper (drafting → pending approval → in technical design / ready for runs) | Solution Design screen |
| Escalate handoff card — business owner → dev/IT, carries the reason | Solution Design screen (conditional) |
| Technical Design ticket — dev-altitude mirror of the same spec: agents to build, data contract, permissions, guardrails | `/build/solutions/:id/technical-design` |
| Handback card — dev → business, plain-language contract (does / won't / owner / when unsure) | Technical Design screen |
| Command Center persona lens — locked to role for regular users, admin-switchable (Store Manager / CFO / Operations Head / All) | Command Center |
| Persona-driven KPIs and pending-decisions filtering | Command Center |
| Agents tagged with persona | Agent Space cards + Agent Detail page |
| New `v3` branch, isolated from `v2` | repo |

### Designed as an interactive mockup only — not in the codebase

These were built with the `visualize` tool as click-through prototypes to align on direction. None of this exists in the actual app yet.

| Feature | Why it matters | Note |
|---|---|---|
| **Unified Agent Studio — one spec, two altitudes** (Business chat view / Developer spec view, single toggle, one version trail) | This was the design brief's central architectural ask | What we actually built instead is **two separate screens** (Solution Design, Technical Design) linked by a ticket — related, but not the same "one object, two altitudes" model. Worth deciding if this gap matters before further building. |
| Agent delegate configuration — tone, culture, communication style, response type, escalation temperament, working hours, "when it's unsure" | Makes an agent read as a delegate with a working style, not a bot with settings | Not started |
| Solution-in-hand fast path — reviewer already has a fix → task breakdown → confirm with the solution provider → assign & notify | Explicitly scoped out in the round that built Solution Design | Not started |
| PII unmask-with-reason flow | We mask by default but there's no "request access" action | Not started |
| Restricted cross-group-company signal access request | Shown as a greyed "restricted" pill with no action behind it | Not started |
| Agent Studio **project workspace** — the task list becoming a live workflow with data connectors, workflow design, output formats, human review gates at every step | The task list today is descriptive text, not a working builder | Not started |
| Solution simulation — test run against fixture data before publish | | Not started |
| UAT publish stage — business testing before production | | Not started |
| Manual production deploy step | Explicitly requested to stay manual | Not started |
| Runs & Actions exception log | Surfacing agent issues to fix | Not started |
| Chase & escalate — both SLA/timer-based (no response in N hours) and feedback-driven (user flags "too noisy" → routes to dev) | Named first-class state, not silent waiting | Not started |
| Assessor agent — independent post-run impact assessment feeding a verdict back into the Decision Ledger | Distinct from the validation agent, which reviews the *plan*, not the outcome | Not started |
| Full closed-loop visual (Decision Ledger verdict writing back to close the originating signal) | | Escalation/handback exist; the ledger-close visualization does not |
| The standalone 12-screen click-through prototype shown in chat | Demo only, its own sandboxed HTML/JS, not wired to real routes or data | Reference only |

## Net effect

Everything under "Designed as an interactive mockup only" is genuinely absent from the running app — that's not a bug, it's scope that was explicitly deferred round by round (see conversation for the exact scoping calls). This table exists so the next round can pick items deliberately instead of assuming they're already there.
