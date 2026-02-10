# Retrospective Log

## Sprint 9: Search

**Date:** 2026-02-09
**Participants:** PO, SM, TL, FE, BE, QA
**Sprint Result:** 29/29 points (BE 11 + FE 15 + QA 3), 2 Boss bugs found and fixed during approval (thumbnail prefix + search input clear)
**Facilitator:** SM

---

### What Went Well

| Member | Feedback |
|--------|----------|
| **TL** | Arch doc 18 sections most thorough yet. P0 bug 9.8 root cause analysis accurate. Code review caught 3 real issues. 29pts clean delivery. |
| **FE** | Clean execution order (9.8→9.4→9.5→9.6). Thorough arch doc. 228 tests. 4 tasks + 2 boss bugs fixed. |
| **BE** | Arch doc Sections 3+14 excellent for search_vector restore. AI-024 debt finally resolved. 59 new tests. MEMORY.md check helped avoid repeat mistakes. |
| **QA** | 32/32 tests first run. Early test planning effective. Complemented BE tests without duplicating (AI-047 progress). |
| **PO** | Fastest sprint yet — 29pts in under 1 hour. Bug 9.8 fix was quick win starting FE. Team communication excellent. Boss bugs fixed within minutes of report. |

**Key Themes:**
1. **Fastest sprint execution ever** (PO, FE — 2 members) — 29pts completed in under 1 hour, fastest delivery in project history
2. **Arch doc quality peak** (TL, FE, BE — 3 members) — 18 sections, most comprehensive doc yet, zero ambiguity
3. **search_vector tech debt resolved** (BE, TL — 2 members) — AI-024 carried from Sprint 6, finally implemented with Prisma `Unsupported("tsvector")?` pattern
4. **Boss Approval Gate working** (PO — 1 member) — AI-055 process caught 2 real bugs, both fixed quickly. Down from 5 bugs in Sprint 8.
5. **MEMORY.md continues ROI** (BE — 1 member) — memory check helped avoid repeat mistakes
6. **QA test quality** (QA — 1 member) — 32/32 first run, complemented (not duplicated) dev tests

---

### What Didn't Go Well

| Member | Feedback |
|--------|----------|
| **TL** | Pre-existing arch doc stub caused confusion. 13 transcode test failures still unresolved from Sprint 6/7. |
| **FE** | SERVER_BASE repeat pattern missed again (recurring). Navigation handler not resetting UI state after router.push(). |
| **BE** | Controller bypassed Zod with manual `as` casts instead of using validated data. Shell DATABASE_URL conflict caused env issues. |
| **QA** | Missed 2 Boss bugs (thumbnail prefix + input clear). Browser walkthrough checked flow not content rendering. 4 selector mismatches wasted time. |
| **PO** | QA missed same category of bugs as Sprint 8 (visual rendering issues). SERVER_BASE is a recurring FE pattern error (3rd+ occurrence). |

**Key Themes (by frequency):**
1. **QA browser test missed visual rendering bugs AGAIN** (QA, PO — 2 members) — Same category as Sprint 8. QA checked flow (click through features) but not content (do thumbnails actually load? does input clear after nav?). Boss caught 2 bugs QA missed.
2. **SERVER_BASE recurring FE pattern** (FE, PO — 2 members) — `<img>` tags missing `SERVER_BASE` prefix is a known gotcha from project memory, yet keeps recurring. 3rd+ occurrence across sprints.
3. **Transcode test debt growing** (TL, BE — 2 members) — 13 test failures from Sprint 6/7 still unresolved. BE mentions pre-existing timeouts. Technical debt accumulating.
4. **Controller bypassed Zod validation** (BE, TL — 2 members) — BE used manual `as` type casts on `req.query` instead of reading from Zod-validated data. TL code review caught this.
5. **Navigation state not reset** (FE — 1 member) — Search input not clearing after `router.push()` navigation. Already documented in MEMORY.md but missed.
6. **Shell DATABASE_URL conflict** (BE — 1 member) — Shell environment variable overrode `.env` file during DB operations.
7. **QA selector mismatches** (QA — 1 member) — 4 test selector mismatches from guessing class names instead of reading FE source.

---

### Improvement Suggestions

| Member | Suggestions |
|--------|-------------|
| **TL** | Address transcode test debt in Sprint 10. Add tsquery sanitization. Arch doc single-source-of-truth (no stale stubs). Code review checklist: controller uses validated data not raw req.query casts. |
| **FE** | Pre-commit mental checklist for img src (SERVER_BASE) and nav state cleanup. Shared SERVER_BASE utility. Arch doc should flag known FE gotchas in Common Pitfalls section. |
| **BE** | Standard Zod-parse-in-controller convention (always use validated output, never `as` cast). Shell env cleanup step before DB operations. |
| **QA** | Verify actual content renders (thumbnails load, images visible). Test input state across navigation. Read FE source for image URL patterns before browser test. Query dev DB first for real data. |
| **PO** | Store SERVER_BASE as project memory lesson. QA browser testing needs content verification not just flow. Consider adding SERVER_BASE to arch doc known gotchas as mandatory item every sprint. |

---

### Sprint 8 Action Items Verification

| # | Item | Status | Evidence |
|---|------|--------|----------|
| AI-042 | Fix transcode test timeouts (BullMQ polling → event-driven) | **NOT DONE** | TL: "13 transcode test failures still unresolved." Carry to Sprint 10. |
| AI-043 | Split fast/slow test groups (`test:fast` npm script) | **NOT DONE** | No evidence of implementation. Carry. |
| AI-044 | Re-seed dev DB reminder to BE prompt | **PARTIAL** | Not explicitly confirmed in BE prompt. |
| AI-045 | Shared `renderWithSWR` test helper | **DEFERRED** | FE focused on search tasks. Not mentioned. |
| AI-046 | Nested SWR children test guidance to FE prompt | **DEFERRED** | SM did not update FE prompt. |
| AI-047 | QA estimate tests AFTER dev coverage review | **PARTIAL** | QA says "complemented BE tests without duplicating" — awareness improved but no formal Dev Coverage Review step. |
| AI-048 | WRITER role + trailerUrl in seed data | **NOT VERIFIED** | Not mentioned by any member. |
| AI-049 | ACCESSIBILITY in TL arch doc checklist | **VERIFIED** | Sprint 9 arch doc Section 7 — full a11y specs for all 5 components. |
| AI-050 | TL verify infra assumptions in arch doc v1 | **VERIFIED** | Sprint 9 arch doc Section 16 — 12 infrastructure checks with results. |
| AI-051 | Tech debt budget (3-5 pts/sprint) | **NOT DONE** | Sprint 9 was 29pts with no explicit debt budget. TL still requesting. |
| AI-052 | PO check open action items before kickoff | **PARTIAL** | Sprint 9 included AI-024 (search_vector) from action items, but not AI-042/AI-043 (transcode). |
| AI-053 | Track TL review HIGH items as backlog | **PARTIAL** | Sprint 8 a11y items (modal focus trap, icon labels) not explicitly in Sprint 9 backlog. |
| AI-024 | search_vector tech debt (Prisma Unsupported) | **VERIFIED** | Task 9.1 implemented. `Unsupported("tsvector")?` in schema.prisma. Both DBs restored. |
| AI-055 | BOSS APPROVAL GATE | **VERIFIED** | Boss tested in browser. Found 2 bugs. Fixed. Boss approved. Process works. |
| AI-056 | QA browser walkthrough | **PARTIAL** | QA did browser walkthrough but missed 2 bugs — checked flow, not content rendering. Needs improvement. |
| AI-057 | Fix Sprint 8 thumbnail URL bug | **VERIFIED** | Fixed prior to Sprint 9. |
| AI-058 | Fix content not showing on Home | **VERIFIED** | Fixed prior to Sprint 9. |
| AI-059 | Fix Preview Modal hover clipped | **VERIFIED** | Fixed prior to Sprint 9. |
| AI-060 | Session expired messaging | **NOT VERIFIED** | Not mentioned by any member. |
| AI-061 | Boss account persistence | **VERIFIED** | Boss tested with boss@webphim.com, account survived Sprint 9. |
| AI-062 | Browser smoke test in DoD | **PARTIAL** | QA did browser test, but quality insufficient (missed 2 bugs). Process exists but needs depth. |
| AI-037 | QA -e2e suffix for test files | **NOT VERIFIED** | No QA test files created in Sprint 9 (QA used BE test framework). |
| AI-038 | Boss account in seed script | **VERIFIED** | Boss account survived Sprint 9 migration + tests. |

**Result: 9 VERIFIED, 5 PARTIAL, 4 NOT DONE, 4 DEFERRED, 2 NOT VERIFIED. Major items AI-024 (search_vector) and AI-055 (Boss gate) RESOLVED.**

---

### Action Items

| # | Item | Owner | Priority | Due | Status |
|---|------|-------|----------|-----|--------|
| AI-063 | SERVER_BASE mandatory gotcha in EVERY arch doc + project memory permanent lesson | TL/SM | **P0** | Sprint 10 | **New** |
| AI-064 | QA browser checklist: verify content renders (thumbnails load, images visible), input state after navigation, real data rendering — not just click-through flow | QA | **P0** | Sprint 10 | **New** |
| AI-065 | Standard Zod-parse-in-controller convention: always use validated output, never `as` cast on req.query/req.body. Add to BE prompt + TL code review checklist | BE/TL | **P1** | Sprint 10 | **New** |
| AI-066 | Shell env var cleanup step: check/unset DATABASE_URL in shell before Prisma operations. Add to BE prompt | BE | **P1** | Sprint 10 | **New** |
| AI-067 | FE pre-commit mental checklist: (1) img src has SERVER_BASE? (2) nav handler resets input state? Add to FE prompt | FE | **P1** | Sprint 10 | **New** |
| AI-068 | Arch doc single-source-of-truth: delete stale stubs, only one arch doc per sprint exists | TL | **P1** | Sprint 10 | **New** |
| AI-069 | tsquery sanitization review: ensure user input to websearch_to_tsquery is safe (edge cases) | TL/BE | **P2** | Sprint 10 | **New** |
| AI-070 | QA read FE source for image URL patterns + query dev DB for real data before browser walkthrough | QA | **P1** | Sprint 10 | **New** |
| AI-071 | TL code review checklist item: controller uses validated data not raw req.query casts | TL | **P1** | Sprint 10 | **New** |

**Carried forward (not done/partial):**

| # | Item | Owner | Priority | Due | Status |
|---|------|-------|----------|-----|--------|
| AI-042 | Fix transcode test timeouts (BullMQ → event-driven) | BE | P1 | Sprint 10 | **Carry** (3rd sprint) |
| AI-043 | Split fast/slow test groups | BE | P1 | Sprint 10 | **Carry** |
| AI-045 | Shared renderWithSWR test helper | FE | P2 | Sprint 10 | **Carry** (deferred) |
| AI-046 | Nested SWR children test guidance | SM | P2 | Sprint 10 | **Carry** |
| AI-047 | QA Dev Coverage Review formal step | QA | P1 | Sprint 10 | **Carry** (partial) |
| AI-051 | Tech debt budget (3-5 pts/sprint) | PO/TL | P2 | Sprint 10 | **Carry** |
| AI-053 | Track TL review HIGH items as backlog | PO | P1 | Sprint 10 | **Carry** |
| AI-060 | Session expired messaging | FE | P1 | Sprint 10 | **Carry** (not verified) |
| AI-037 | QA -e2e suffix for test files | QA | P2 | Sprint 10 | **Carry** |
| AI-027 | Supertest EPIPE — QA prompt update | SM | P2 | Sprint 10+ | **Carry** |
| AI-030 | Multipart+auth — QA prompt update | SM | P2 | Sprint 10+ | **Carry** |
| AI-031 | Playwright E2E planning | QA/TL | P2 | Sprint 10+ | **Carry** |

---

### Prompt/Workflow Updates Needed

1. **TL_PROMPT.md** — Add: SERVER_BASE as mandatory gotcha in every arch doc, code review checklist item for Zod-validated data usage, arch doc single-source-of-truth rule
2. **BE_PROMPT.md** — Add: standard Zod-parse-in-controller convention (never `as` cast), shell env var cleanup step before Prisma operations
3. **FE_PROMPT.md** — Add: pre-commit mental checklist (SERVER_BASE on img, nav state reset), arch doc Common Pitfalls section request
4. **QA_PROMPT.md** — Add: browser walkthrough must verify content rendering (thumbnails, images, real data) not just flow, read FE source for URL patterns, query dev DB before testing
5. **workflow.md** — No structural changes needed (Boss gate already in place from Sprint 8 supplementary retro)

---

### Lessons Learned (Saved to Memory)

1. **Boss Approval Gate (AI-055) is working** — Down from 5 Boss bugs (Sprint 8) to 2 (Sprint 9). The process catches real issues that unit/integration tests miss. Keep mandatory.
2. **QA browser testing needs CONTENT verification, not just FLOW** — QA clicked through all features (flow works) but didn't verify thumbnails actually loaded or inputs cleared after navigation. Browser testing must verify what the USER SEES, not what the CODE DOES.
3. **SERVER_BASE is a systemic FE pattern** — 3rd+ occurrence. Must be in project memory AND arch doc mandatory gotchas. Any `<img>` with BE-hosted src MUST prepend SERVER_BASE.
4. **Controllers must use Zod-validated output** — Manual `as` casts on req.query bypass validation. TL code review caught this. Standard convention: always read from validated schema output.
5. **Shell env vars override .env files** — `DATABASE_URL` set in shell overrides `.env` file for Prisma operations. Always check/unset before DB work.
6. **Navigation handlers must reset UI state** — `router.push()` navigates away but doesn't clear input values or collapse expanded UI. Already in MEMORY.md but still missed. Needs FE prompt reinforcement.

---

### Sprint 9 Velocity

| Metric | Value |
|--------|-------|
| Story Points Committed | 29 |
| Story Points Completed | 29 |
| Velocity | 29 pts/sprint |
| Tests Written (this sprint) | ~91 (FE + BE 59 + QA 32) |
| Tests Total | ~441 |
| Bugs Found (QA) | 0 |
| **Bugs Found (Boss)** | **2** (thumbnail prefix, search input clear) |
| TL Review | Approved (3 issues caught) |
| Role Violations | 0 |

### Cumulative Velocity Trend

| Sprint | Points | Tests | Bugs (QA) | Bugs (Boss) |
|--------|--------|-------|-----------|-------------|
| Sprint 2 | 66 | 48 | 0 | — |
| Sprint 3+4 | 75 | 155 | 0 | — |
| Sprint 5 | 40 | 56 | 0 | — |
| Sprint 6 | 45 | 73 | 0 | — |
| Sprint 7 | 41 | 59 | 0 | — |
| Sprint 8 | 33 | 159 | 0 | 5 |
| Sprint 9 | 29 | ~91 | 0 | **2** |
| **Total** | **329** | **~641** | **0** | **7** |

**TREND: Boss bugs 5 → 2 (60% reduction). Boss Approval Gate proving effective. QA browser testing improving but needs content verification depth.**

---

## Sprint 8: Content Detail & Preview Modal

**Date:** 2026-02-09
**Participants:** PO, SM, TL, FE, BE, QA
**Sprint Result:** 33/33 points (FE 24 + BE 3 + Infra 6), 350 total tests (159 new), **5 bugs found by Boss in browser demo** (0 by QA)
**Facilitator:** SM

---

### What Went Well

| Member | Feedback |
|--------|----------|
| **TL** | Arch doc checklist saved time (4th sprint). Test DB finally delivered. Component reuse paid off. 0 bugs correlates with doc quality. Clean focused scope. |
| **FE** | Task dependency ordering great. Shared components reused cleanly. Arch doc detailed with exact props. 45 tests passed. SWR cache pattern from MEMORY.md helped. |
| **BE** | Test DB isolation smooth. Similar API one-pass (10/10 tests). Arch doc Section 13 zero ambiguity. |
| **QA** | Early test planning effective. Test DB isolation resolved AI-028. Dev coverage excellent (55 tests). 0 bugs 4th consecutive. Pre-testing checklist caught gotchas. |
| **PO** | Fastest sprint execution yet. SM review gate caught 3 real issues before coding. P0 action items AI-028+AI-033 finally resolved. 5th consecutive 0-bug sprint. |

**Key Themes:**
1. **5th consecutive 0-bug sprint** (QA, PO — 2 members) — strongest quality streak yet
2. **Test DB isolation finally delivered** (BE, QA, TL, PO — 4 members) — AI-028 resolved after 2 sprints overdue
3. **SM review gate proved its value** (PO — 1 member) — caught 3 real issues in arch doc before coding started (test DB assumption, missing test health baseline, missing E2E strategy)
4. **Arch doc quality continues to compound** (all 5 members) — 6th sprint with minimal clarification loops
5. **MEMORY.md paying off** (FE — 1 member) — SWR cache isolation pattern from memory prevented repeat mistakes
6. **Fastest sprint execution** (PO — 1 member) — all tasks completed efficiently

---

### What Didn't Go Well

| Member | Feedback |
|--------|----------|
| **TL** | AI-028 was 2 sprints overdue. A11y not addressed (systemic gap). Should verify infra assumptions in v1. DRY violations growing. |
| **FE** | SimilarTitles test wrong data shape for /similar (ContentDetail vs array). MovieCard compact mode test missed alt text. |
| **BE** | 3 transcode E2E tests timeout (pre-existing BullMQ polling). Inflate run time 23s→330s. |
| **QA** | Test estimate off (planned 45, wrote 17). Dev DB empty when QA started. 2 pre-existing timeouts. |
| **PO** | Sprint initially scoped at 27pts, grew to 33pts with infra tasks. Should have included AI-028/AI-033 in original backlog, not added mid-planning. |

**Key Themes (by frequency):**
1. **Pre-existing transcode test timeouts** (BE, QA, TL — 3 members) — BullMQ polling inflates test run from 23s→330s, 3 tests timeout. Systemic issue across sprints.
2. **Sprint scope grew mid-planning** (PO — 1 member) — 27→33 pts because P0 debt items (AI-028/AI-033) not pre-planned in backlog
3. **A11y systemic gap** (TL — 1 member) — no accessibility requirements in arch doc checklist, TL review found 2 HIGH a11y issues (modal role=dialog, icon aria-labels)
4. **QA test estimate off** (QA — 1 member) — planned 45 tests, wrote 17 (devs already wrote the rest). Needs to review dev tests first for gap analysis.
5. **FE test data shape mismatch** (FE — 1 member) — SimilarTitles mock returned ContentDetail instead of ContentSummary array
6. **Dev DB empty when QA started** (QA — 1 member) — test DB setup wiped dev DB before re-seed, QA started with empty data

---

### Improvement Suggestions

| Member | Suggestions |
|--------|-------------|
| **TL** | Add ACCESSIBILITY to arch doc checklist. Verify infra assumptions in v1. Consider tech debt budget (3-5 pts/sprint). Track getSimilar query optimization. |
| **FE** | Standardize URL-aware SWR mock fetcher helper. Extract SERVER_BASE to shared lib. Nested SWR children test guidance. Shared renderWithSWR helper. |
| **BE** | Event-driven transcode tests (replace polling). Split fast/slow test groups. Re-seed dev DB after test DB setup. |
| **QA** | Estimate QA tests AFTER dev test review. Verify dev DB seed before QA. Add WRITER role + trailerUrl to seed. Dev Coverage Review section in test plan template. |
| **PO** | Pre-plan infra/debt tasks in backlog before sprint kickoff. Track TL code review HIGH items as backlog items immediately. Check open action items before kickoff. |

---

### Sprint 7 Action Items Verification

| # | Item | Status | Evidence |
|---|------|--------|----------|
| AI-028 | Set up dedicated test DB (`webphim_test`) | **VERIFIED** | Task 8.7 delivered. `.env.test` created, `webphim_test` DB active, dev DB preserved. All members confirm. |
| AI-033 | Fix pre-existing test failures | **VERIFIED** | Task 8.8 confirmed all 161 tests pass against `webphim_test`. content.test.ts FK + queue.test.ts race both green. |
| AI-034 | React 19 lint gotchas in MEMORY.md + arch doc | **VERIFIED** | MEMORY.md has entry. Sprint 8 arch doc Section 11 includes React 19 lint gotcha. |
| AI-035 | Pre-existing test health check in TL arch doc | **VERIFIED** | Sprint 8 arch doc Section 4a — full test health baseline with 161/161 pass. |
| AI-036 | E2E test strategy in TL arch doc | **VERIFIED** | Sprint 8 arch doc Section 4b — 5-layer strategy table with patterns per layer. |
| AI-037 | QA use `-e2e` suffix for test files | **PARTIAL** | QA prompt awareness, but Sprint 8 had no QA-created test files to verify against. |
| AI-038 | Boss account in seed script | **PARTIAL** | Not explicitly confirmed. Dev DB still needed manual re-seed when QA started. |
| AI-039 | Shared vitest hls.js mock file | **DEFERRED** | Sprint 8 was modal/detail focused, not video player. No hls.js mocks needed. |
| AI-040 | Merge tightly coupled tasks | **VERIFIED** | Sprint 8 tasks were cleanly scoped — no empty tasks. PO/TL awareness confirmed. |
| AI-041 | Zod uuid() all-zero pattern | **PARTIAL** | MEMORY.md has entry. Arch doc Section 11 doesn't explicitly list it (not relevant for Sprint 8). |
| AI-025 | SWR cache isolation in TL arch doc | **VERIFIED** | Sprint 8 arch doc Section 4 FE tests: "SWR cache isolation: Wrap renders in `<SWRConfig value={{ provider: () => new Map() }}>`". |
| AI-026 | vi.fn() typing in TL arch doc | **VERIFIED** | Sprint 8 arch doc Section 11: "Vitest 4 vi.fn() typing" in gotchas table. |
| AI-027 | Supertest EPIPE in QA prompt | **PARTIAL** | MEMORY.md has pattern. QA prompt update not explicitly confirmed. |
| AI-030 | Multipart+auth pattern in QA prompt | **PARTIAL** | Same as AI-027 — MEMORY.md done, QA prompt update unconfirmed. |
| AI-031 | Playwright E2E planning | **PENDING** | Still future scope. No Playwright tests yet. |

**Result: 7 VERIFIED, 5 PARTIAL, 1 DEFERRED, 2 PENDING. Major P0 items AI-028 + AI-033 fully resolved.**

---

### Action Items

| # | Item | Owner | Priority | Due | Status |
|---|------|-------|----------|-----|--------|
| AI-042 | Fix transcode test timeouts: replace BullMQ polling with event-driven pattern | BE | P1 | Sprint 9 | **New** |
| AI-043 | Split fast/slow test groups (`test:fast` npm script, exclude transcode) | BE | P1 | Sprint 9 | **New** |
| AI-044 | Add re-seed dev DB reminder to BE prompt after test runs | SM | P1 | Sprint 9 | **New** |
| AI-045 | Create shared `renderWithSWR` test helper + URL-aware SWR mock fetcher | FE | P1 | Sprint 9 | **New** |
| AI-046 | Add nested SWR children test guidance to FE prompt | SM | P1 | Sprint 9 | **New** |
| AI-047 | QA estimate tests AFTER reviewing dev test coverage (Dev Coverage Review) | QA | P1 | Sprint 9 | **New** |
| AI-048 | Add WRITER role cast members + trailerUrl to seed data | BE | P1 | Sprint 9 | **New** |
| AI-049 | Add ACCESSIBILITY section to TL arch doc checklist (role, aria-label, focus trap, keyboard nav) | TL | P0 | Sprint 9 | **New** |
| AI-050 | TL verify infra assumptions in arch doc v1 (DB exists, services running, env vars) | TL | P1 | Sprint 9 | **New** |
| AI-051 | Consider tech debt budget (3-5 pts/sprint) in sprint planning | PO/TL | P2 | Sprint 9 | **New** |
| AI-052 | PO check open action items against sprint backlog before kickoff (avoid mid-planning scope growth) | PO | P1 | Sprint 9 | **New** |
| AI-053 | Track TL code review HIGH items as immediate backlog items | PO | P1 | Sprint 9 | **New** |
| AI-054 | Track getSimilar query optimization (potential N+1 at scale) | TL/BE | P2 | Sprint 9+ | **New** |

**Carried forward (partial):**

| # | Item | Owner | Priority | Due | Status |
|---|------|-------|----------|-----|--------|
| AI-037 | QA use `-e2e` suffix for test files | QA | P1 | Sprint 9 | **Carry** (no QA test files in Sprint 8 to verify) |
| AI-038 | Boss account in seed script | BE | P1 | Sprint 9 | **Carry** (dev DB still needed manual re-seed) |
| AI-027 | Supertest EPIPE — confirm QA prompt updated | SM | P2 | Sprint 9 | **Carry** |
| AI-030 | Multipart+auth pattern — confirm QA prompt updated | SM | P2 | Sprint 9 | **Carry** |
| AI-031 | Playwright E2E planning | QA/TL | P2 | Sprint 9+ | **Carry** |
| AI-024 | search_vector tech debt (Prisma Unsupported type) | TL/BE | P1 | Sprint 9 | **Carry** (due this sprint) |

**Tech Debt (TL Review):**

| Item | Severity | Source | Status |
|------|----------|--------|--------|
| Modal `role="dialog"` + focus trap (a11y) | HIGH | TL Sprint 8 review | Track as backlog (AI-053) |
| Icon `aria-label` attributes (a11y) | HIGH | TL Sprint 8 review | Track as backlog (AI-053) |

---

### Prompt/Workflow Updates Needed

1. **TL_PROMPT.md** — Add: ACCESSIBILITY section in arch doc checklist (role, aria-label, focus trap, keyboard nav), verify infra assumptions in v1
2. **BE_PROMPT.md** — Add: re-seed dev DB reminder after test runs, event-driven test pattern for async workers
3. **FE_PROMPT.md** — Add: nested SWR children test guidance, shared renderWithSWR helper pattern
4. **QA_PROMPT.md** — Add: Dev Coverage Review section — review dev tests before estimating QA tests, verify dev DB has seed data before starting
5. **PO_PROMPT.md** — Add: check open action items against sprint backlog before kickoff, track TL review HIGH items as immediate backlog
6. **workflow.md** — Add: consider tech debt budget (3-5 pts/sprint) in sprint planning

---

### Lessons Learned (Saved to Memory)

1. **SM review gate catches real issues** — SM's 9-point arch doc verification caught 3 issues (test DB assumption, missing test health baseline, missing E2E strategy) before any coding started. This prevented mid-sprint surprises.
2. **P0 debt items must be pre-planned** — AI-028 was 2 sprints overdue and caused mid-planning scope growth (27→33 pts). PO should check open action items against sprint backlog before kickoff.
3. **Accessibility is a systemic gap** — No a11y requirements in any arch doc to date. TL review found 2 HIGH items in Sprint 8. Must add ACCESSIBILITY to arch doc checklist going forward.
4. **QA test estimates need dev test review** — QA planned 45 tests but devs already wrote 55. QA should review dev test coverage first, then estimate gap analysis tests only.
5. **BullMQ polling tests are a time bomb** — 3 transcode tests inflate run from 23s→330s via polling. Event-driven pattern needed to keep test suite fast.
6. **MEMORY.md is proving its ROI** — FE explicitly credits SWR cache pattern from memory for preventing repeat mistakes. Validates the memory system investment.

---

### SUPPLEMENTARY RETRO — Boss Demo Failure (CRITICAL)

**Date:** 2026-02-09 (post-sprint)
**Trigger:** Boss tested Sprint 8 in real browser. Demo failed on multiple fronts.
**Severity:** CRITICAL — exposes systemic gap in QA/delivery process.

#### Boss Findings (5 Real Bugs)

| # | Bug | Category | Missed By |
|---|-----|----------|-----------|
| 1 | Thumbnails URL wrong | FE bug — incorrect image paths | FE, QA, TL |
| 2 | Content not showing on Home page | Cache + architecture gap — stale data or missing data flow | FE, BE, QA, TL |
| 3 | Preview Modal hover hidden | FE bug — `overflow-hidden` on parent clips hover overlay | FE, QA, TL |
| 4 | Session expired messaging unclear | UX gap — no clear feedback when token expires | FE, QA |
| 5 | Boss account lost (5th time) | Infra — test runs still wiping dev accounts despite AI-028 | BE, QA |

#### Root Cause Analysis

**The "0 bugs" claim was FALSE.** QA found 0 bugs because:
1. **No real browser testing** — all tests are unit/integration (Vitest + RTL + supertest). No one opened a browser and clicked through the actual app.
2. **No E2E smoke test** — MEMORY.md already has "E2E smoke test needed before declaring sprint done" from Sprint 5 lesson. We didn't follow our own lessons.
3. **No Boss demo step** — Sprint close flow was: FE/BE done → QA test → TL review → close. Boss was not in the loop for acceptance testing.
4. **Thumbnail/content bugs are integration issues** — unit tests mock API responses and don't catch real data flow problems.
5. **Boss account loss is a recurring problem** — 5th time. AI-028 (test DB) was supposed to fix this, but seed/re-seed workflow is still broken.

#### Process Failure — SM Self-Assessment

**SM takes responsibility.** As Scrum Master:
- I celebrated "5th consecutive 0-bug sprint" without questioning if QA testing was sufficient.
- I did not enforce the "E2E smoke test" lesson from MEMORY.md.
- I did not ensure a real browser walkthrough before declaring done.
- The SM review gate caught arch doc issues but not the missing demo/acceptance step.

#### New Mandatory Process: Boss Approval Gate

**Effective immediately.** Sprint close flow changes to:

```
OLD: FE/BE done → QA test → TL review → Sprint Close
NEW: FE/BE done → QA test (incl. browser test) → TL review → BOSS APPROVE (real browser) → Sprint Close
```

**Boss Approval means:**
- Boss (or PO as proxy) opens the real app in a browser
- Clicks through ALL new features manually
- Tests with real seed data (not mocked)
- Verifies existing features still work (regression)
- Reports bugs → team fixes → Boss re-tests → Boss approves → THEN sprint closes

#### Supplementary Action Items

| # | Item | Owner | Priority | Due | Status |
|---|------|-------|----------|-----|--------|
| AI-055 | **BOSS APPROVAL GATE**: Add Boss browser test as mandatory step before sprint close | SM/PO | **P0** | Immediate | **New** |
| AI-056 | **QA BROWSER TEST**: QA must do real browser walkthrough (not just unit/integration) before reporting 0 bugs | QA | **P0** | Sprint 9 | **New** |
| AI-057 | Fix Sprint 8 thumbnail URL bug | FE | P0 | Sprint 9 | **New** |
| AI-058 | Fix content not showing on Home (cache/data flow) | FE/BE | P0 | Sprint 9 | **New** |
| AI-059 | Fix Preview Modal hover clipped by overflow-hidden | FE | P0 | Sprint 9 | **New** |
| AI-060 | Clear session expired messaging/UX | FE | P1 | Sprint 9 | **New** |
| AI-061 | Boss account persistence — verify seed + test isolation actually works | BE | P0 | Sprint 9 | **New** |
| AI-062 | Add "real browser smoke test" to Definition of Done for every sprint | SM | P0 | Immediate | **New** |

#### Workflow Update Required

**workflow.md Step 11 must change:**
- OLD Step 8: FE/BE → PO: Sprint completion report
- NEW Step 8: FE/BE → PO: Sprint completion report
- NEW Step 8a: **QA browser smoke test** (real app, real data)
- NEW Step 8b: **BOSS APPROVAL** (Boss tests in real browser, approves or rejects)
- Step 9-11: Only proceed after Boss approval

#### Lessons Learned (CRITICAL — Save to Memory)

1. **"0 bugs" means nothing without real browser testing.** 350 unit/integration tests passed while 5 real bugs existed. Unit tests test code in isolation — they do NOT test the actual user experience.
2. **Boss is the ultimate QA.** No sprint is done until Boss clicks through the app and approves. This is non-negotiable.
3. **Follow your own lessons.** MEMORY.md already said "E2E smoke test needed before declaring sprint done" — we ignored it.
4. **Boss account is sacred.** 5th time lost. Must be in seed script AND test isolation must be verified end-to-end.

---

### Sprint 8 Velocity

| Metric | Value |
|--------|-------|
| Story Points Committed | 33 |
| Story Points Completed | 33 |
| Velocity | 33 pts/sprint |
| Tests Written (this sprint) | 159 |
| Tests Total | 350 |
| Bugs Found (QA) | 0 |
| **Bugs Found (Boss Demo)** | **5** |
| TL Review | Approved (2 HIGH a11y tech debt) |
| Role Violations | 0 |

### Cumulative Velocity Trend

| Sprint | Points | Tests | Bugs (QA) | Bugs (Boss) |
|--------|--------|-------|-----------|-------------|
| Sprint 2 | 66 | 48 | 0 | — |
| Sprint 3+4 | 75 | 155 | 0 | — |
| Sprint 5 | 40 | 56 | 0 | — |
| Sprint 6 | 45 | 73 | 0 | — |
| Sprint 7 | 41 | 59 | 0 | — |
| Sprint 8 | 33 | 159 | 0 | **5** |
| **Total** | **300** | **550** | **0** | **5** |

**NOTE:** Previous "0 bugs" streak was only measuring QA-found bugs. Boss demo testing was not part of the process until Sprint 8. Real quality includes Boss acceptance.

---

## Sprint 7: Video Player

**Date:** 2026-02-08
**Participants:** PO, SM, TL, FE, BE, QA
**Sprint Result:** 41/41 points (30 FE + 6 BE + 5 QA), 59 tests (40 FE + 14 BE + 5 QA), 0 bugs
**Facilitator:** SM

---

### What Went Well

| Member | Feedback |
|--------|----------|
| **TL** | Arch doc gotchas prevented integration bugs. AI-023 drift check saved production (orphaned trigger caught). Clean first reviews. |
| **FE** | Clean task ordering. Arch doc saved research time. React 19 lint caught real bugs. 30pts, 40 tests, zero rework. |
| **BE** | Lightest BE sprint, clean implementation. TL arch doc excellent. Cleanup migration smooth. |
| **QA** | 7-step E2E strategy crystal clear. Boundary testing 5%/90% correct first try. 0 bugs found. Reused Sprint 6 patterns. |
| **PO** | Sprint very smooth, 4th consecutive 0-bug sprint, team velocity excellent. |

**Key Themes:**
1. **4th consecutive 0-bug sprint** (all members) — Sprint 3+4, 5, 6, 7 all zero bugs
2. **AI-023 migration drift check proved its value** (TL, BE) — orphaned trigger caught and fixed before it crashed production
3. **Arch doc quality continues to compound** (all members) — 5th sprint with minimal clarification loops
4. **FE-heavy sprint executed smoothly** (FE, PO) — 30pts/40 tests with zero rework
5. **QA E2E strategy worked** (QA) — 7-step flow, boundary tests correct first try

---

### What Didn't Go Well

| Member | Feedback |
|--------|----------|
| **TL** | Pre-existing content.test.ts FK failures (2 tests). QA E2E fragile due to full pipeline dependency (upload→transcode→stream). |
| **FE** | React 19 strict lint rules required restructuring twice (refs-in-render, setState-in-effect). Vitest `vi.fn()` typing resurfaced (AI-026). Task 7.6 was a no-op (already in 7.1). |
| **BE** | Tests still wipe dev DB — no isolation (AI-028 NOT done). Every test run needs re-seed + re-register boss. Zod `uuid()` rejects all-zero UUIDs. |
| **QA** | Pre-existing flaky queue.test.ts (357 unhandled rejections from BullMQ worker race). File name collision with BE test file. |

**Key Themes (by frequency):**
1. **Test DB isolation STILL not done** (BE + PO — 2 members, AI-028 carried from Sprint 6) — tests wipe dev DB, need re-seed every run. PO escalating to P0.
2. **Pre-existing broken/flaky tests** (TL + QA — 2 members) — content.test.ts FK failures + queue.test.ts BullMQ race condition (357 unhandled rejections)
3. **React 19 lint strictness** (FE — 1 member) — refs-in-render and setState-in-effect required component restructuring twice
4. **vi.fn() typing resurfaced** (FE — 1 member) — AI-026 from Sprint 6 still causing friction
5. **E2E test fragility** (TL — 1 member) — full pipeline dependency makes E2E slow and brittle
6. **Empty task** (FE — 1 member) — Task 7.6 (Error Handling) was already in 7.1, creating an empty commit situation

---

### Improvement Suggestions

| Member | Suggestions |
|--------|-------------|
| **TL** | Fix pre-existing test failures. E2E needs fixtures/mocking instead of real FFmpeg. Add ProgressBar/VolumeControl unit tests. |
| **FE** | Note React 19 lint gotchas in arch doc. Shared vitest hls.js mock file. Extract auth restore into shared hook. Consider merging tightly coupled tasks to avoid empty commits. |
| **BE** | Set up separate test DB (`webphim_test`) — P0. Add boss account to seed script. |
| **QA** | Fix queue.test.ts worker shutdown timing. Shared video pipeline helper for E2E. QA use `-e2e` suffix for test files. QA check existing test files first. Separate flaky test reporting. Adjust estimates when BE writes own tests. |
| **PO** | Test DB isolation must be P0 for Sprint 8. Overall process solid. |

---

### Sprint 6 Action Items Verification

| # | Item | Status | Evidence |
|---|------|--------|----------|
| AI-023 | Migration drift check in TL checklist | **VERIFIED** | Sprint 7 arch doc Section 2 — dedicated drift check, found orphaned trigger, exact SQL fix provided. |
| AI-024 | search_vector tech debt | **DEFERRED** | Due Sprint 9. Not yet due. |
| AI-025 | SWR cache isolation in MEMORY.md + arch doc | **PARTIAL** | MEMORY.md updated with SWR pattern. TL arch doc FE test gotchas section not yet added to template. |
| AI-026 | vi.fn() generic typing in MEMORY.md | **PARTIAL** | MEMORY.md updated. FE reports issue resurfaced — needs more prominent placement or arch doc inclusion. |
| AI-027 | Supertest EPIPE pattern in MEMORY.md + QA prompt | **PARTIAL** | MEMORY.md updated. QA prompt update status unclear. |
| AI-028 | Dedicated test DB (webphim_test) | **NOT DONE** | BE confirms tests still wipe dev DB. **ESCALATE TO P0.** |
| AI-029 | DB cleanup section in TL template | **VERIFIED** | Sprint 7 arch doc Section 2 has pre-migration cleanup SQL. |
| AI-030 | Multipart+auth pattern in QA prompt | **PARTIAL** | Not explicitly confirmed by QA. |
| AI-031 | Playwright E2E planning | **PENDING** | Due Sprint 7+, QA suggests planning continues. |
| AI-032 | Sprint 7 player control specs early | **VERIFIED** | Sprint 7 arch doc Section 6 has full player specs with props interfaces. |

**Result: 4 VERIFIED, 1 DEFERRED, 4 PARTIAL, 1 NOT DONE. AI-028 escalated to P0.**

---

### Action Items

| # | Item | Owner | Priority | Due | Status |
|---|------|-------|----------|-----|--------|
| AI-028 | Set up dedicated test DB (`webphim_test`) with `.env.test` | BE/QA | **P0** | Sprint 8 | **Escalated** (was P1, now P0 per PO+BE) |
| AI-033 | Fix pre-existing test failures: content.test.ts FK + queue.test.ts BullMQ race | BE | P0 | Sprint 8 | **New** |
| AI-034 | Add React 19 lint gotchas to MEMORY.md + TL arch doc FE section | SM/TL | P1 | Sprint 8 | **New** |
| AI-035 | Add pre-existing test health check to TL arch doc checklist | TL | P1 | Sprint 8 | **New** |
| AI-036 | Add E2E test strategy section to TL arch doc (fixtures/mocking vs real pipeline) | TL | P1 | Sprint 8 | **New** |
| AI-037 | QA use `-e2e` suffix for test files to avoid name collisions | QA | P1 | Sprint 8 | **New** |
| AI-038 | Add boss account to seed script (avoid manual re-register after test wipes) | BE | P1 | Sprint 8 | **New** |
| AI-039 | Shared vitest hls.js mock file for FE tests | FE | P2 | Sprint 8 | **New** |
| AI-040 | Consider merging tightly coupled tasks in sprint planning (avoid empty commits) | PO/TL | P2 | Sprint 8 | **New** |
| AI-041 | Zod `uuid()` rejects all-zero UUIDs — document pattern for test data | SM | P2 | Sprint 8 | **New** |

**Carried forward (partial):**
| AI-025 | SWR cache isolation — add FE test gotchas to TL arch doc template | TL | P1 | Sprint 8 | **Carry** |
| AI-026 | vi.fn() typing — include in arch doc FE section | TL | P1 | Sprint 8 | **Carry** |
| AI-027 | Supertest EPIPE — confirm QA prompt updated | SM | P1 | Sprint 8 | **Carry** |
| AI-030 | Multipart+auth pattern — confirm QA prompt updated | SM | P1 | Sprint 8 | **Carry** |
| AI-031 | Playwright E2E planning | QA/TL | P2 | Sprint 8 | **Carry** |

---

### Prompt/Workflow Updates Needed

1. **TL_PROMPT.md** — Add: pre-existing test health check to checklist, E2E test strategy section, FE test gotchas section (React 19 lint, SWR cache, vi.fn() typing)
2. **BE_PROMPT.md** — Add: test DB isolation is mandatory (not optional), boss account in seed script
3. **QA_PROMPT.md** — Add: use `-e2e` suffix for test files, check existing test file names before creating, separate flaky test reporting
4. **MEMORY.md** — Add: React 19 lint gotchas (refs-in-render, setState-in-effect), Zod uuid() all-zero rejection
5. **workflow.md** — Add: consider merging tightly coupled tasks to avoid empty task/commit situations

---

### Lessons Learned (Saved to Memory)

1. **AI-023 migration drift check proved its value in Sprint 7** — orphaned trigger would have crashed production content writes. Worth the checklist overhead.
2. **Test DB isolation is a recurring pain** — 2 sprints (6+7) without action. Dev DB wipes cause re-seed overhead every test run. Must be P0.
3. **React 19 strict lint rules** — `refs-in-render` and `setState-in-effect` patterns caught by ESLint in React 19. Components may need restructuring (useRef → useImperativeHandle, effects for derived state → useMemo).
4. **Pre-existing broken tests accumulate** — content.test.ts FK failures + queue.test.ts BullMQ race went unfixed across sprints. Fix test health before new features.
5. **Tightly coupled tasks create empty commits** — Task 7.6 (Error Handling) was already implemented inside 7.1 (HLS Player). Consider merging during planning.
6. **Zod uuid() rejects all-zero UUIDs** — `z.string().uuid()` in Zod 4 rejects `00000000-0000-0000-0000-000000000000`. Use real UUIDs in test fixtures.

---

### Sprint 7 Velocity

| Metric | Value |
|--------|-------|
| Story Points Committed | 41 |
| Story Points Completed | 41 |
| Velocity | 41 pts/sprint |
| Tests Written | 59 (40 FE + 14 BE + 5 QA) |
| Tests Passing | 59 (100%) |
| Bugs Found | 0 |
| Pre-existing Flaky | 1 (queue.test.ts) |
| TL Review | All approved |
| Role Violations | 0 |

### Cumulative Velocity Trend

| Sprint | Points | Tests | Bugs |
|--------|--------|-------|------|
| Sprint 2 | 66 | 48 | 0 |
| Sprint 3+4 | 75 | 155 | 0 |
| Sprint 5 | 40 | 56 | 0 |
| Sprint 6 | 45 | 73 | 0 |
| Sprint 7 | 41 | 59 | 0 |
| **Total** | **267** | **391** | **0** |

---

## Sprint 6: Video Upload & Transcode

**Date:** 2026-02-08
**Participants:** PO, SM, TL, FE, BE, QA
**Sprint Result:** 45/45 points (32 BE + 8 FE + 5 QA), 73 tests (36 BE + 21 FE + 16 QA), 0 bugs
**Facilitator:** SM

---

### What Went Well

| Member | Feedback |
|--------|----------|
| **TL** | Arch doc thorough, zero clarification loops, FE/BE parallel worked, gotchas section prevented issues. |
| **FE** | Arch doc component tree excellent, parallel work with BE smooth, 21 tests passing first try. |
| **BE** | Arch doc excellent, suggested task order (6.3→6.1→6.2→6.5→6.4→6.6) optimal, pre-coding checklist caught multer issue, 36 tests all green. |
| **QA** | Pre-testing checklist smooth, early test planning (AI-010) worked great, 0 bugs found, integration test worked first time. |
| **PO** | Sprint went smoothly, zero clarification loops, arch doc quality continues to improve. |

**Key Themes:**
1. **Arch doc unanimously praised** (all 5 members) — zero clarification loops, 4th consecutive sprint with doc-first success
2. **Zero bugs** (all members) — 3rd consecutive 0-bug sprint (Sprint 3+4, 5, 6)
3. **FE/BE parallel worked** (TL, FE) — first true full-stack sprint with parallel execution
4. **Gotchas section prevented real issues** (TL, BE) — multer 2.x, BullMQ+ioredis, BigInt JSON all caught pre-coding
5. **QA early involvement (AI-010) continues to pay off** — integration test passed first time

---

### What Didn't Go Well

| Member | Feedback |
|--------|----------|
| **TL** | Migration dropped search_vector column + idx_content_search (Prisma drift). |
| **FE** | SWR test caching caused 6 failures (needed `provider:()=>new Map()`), `vi.fn()` typing issues, minor test assertion mismatch. |
| **BE** | Orphaned PostgreSQL trigger caused cryptic error (~5min debug). Multer+supertest EPIPE flaky on auth rejection. |
| **QA** | Supertest EPIPE on multipart+auth rejection (same as BE). No dedicated test DB (`webphim_test`) despite arch doc recommendation. |

**Key Themes (by frequency):**
1. **Supertest EPIPE on multipart+auth rejection** (BE + QA — 2 members) — flaky behavior when supertest sends multipart to an endpoint that rejects auth before reading the file body
2. **Prisma migration drift** (TL — 1 member) — `prisma migrate dev` dropped manually-added `search_vector` column and `idx_content_search` index because they weren't in the Prisma schema
3. **SWR test caching** (FE — 1 member) — SWR's internal cache persists between tests, causing 6 false failures
4. **No dedicated test DB** (QA — 1 member) — arch doc recommended `webphim_test` but wasn't actually set up
5. **Orphaned PostgreSQL trigger** (BE — 1 member) — old trigger from manual SQL caused cryptic error on new migration

---

### Improvement Suggestions

| Member | Suggestions |
|--------|-------------|
| **TL** | Add migration drift check to arch doc checklist. Consider `Unsupported` type for manually-managed columns like search_vector. |
| **FE** | TL add FE test gotchas section to arch doc. Shared SWR test utility. Sprint 7 needs player control design specs early. |
| **BE** | TL add DB cleanup section for migrations. Pre-migration checklist for triggers/functions/views. Document curl commands for FE integration. |
| **QA** | Set up dedicated test DB with `.env.test`. Shared test helper for upload+transcode flow. Plan Playwright E2E for integration sprints. |
| **PO** | Track search_vector as tech debt for Sprint 9. Overall process is solid. |

---

### Sprint 3+4 Action Items Verification

| # | Item | Status | Evidence |
|---|------|--------|----------|
| AI-013 | NO cross-role code edits — hard rule | **VERIFIED** | Zero role violations in Sprint 5+6. Rule in workflow.md. |
| AI-014 | PO prompt: NEVER edit code files | **VERIFIED** | PO prompt updated. No violations in Sprint 5+6. |
| AI-015 | SM flags role violations in real-time | **VERIFIED** | SM prompt updated with monitoring responsibility. |
| AI-016 | CORS multi-origin in TL checklist | **VERIFIED** | Sprint 6 arch doc Section 8 has full CORS config. |
| AI-017 | FE write tests WITH each component | **VERIFIED** | FE delivered 21 tests alongside components. |
| AI-018 | Integration tests | **VERIFIED** | QA wrote 16 integration tests, passed first time. |
| AI-019 | BE keep dev server running | **VERIFIED** | WHITEBOARD shows BE server on 5001 throughout sprint. |
| AI-020 | Validated query middleware pattern | **VERIFIED** | Sprint 6 arch doc Section 11 (AI-020) documented pattern. |
| AI-021 | Seed data review step | **VERIFIED** | Sprint 6 arch doc has "Seed Data Review (AI-021)" section. |
| AI-022 | FE visual verify before commit | **VERIFIED** | Sprint 5 caught double-unwrapping bug via visual verify. |

**Result: 10/10 action items VERIFIED and CLOSED.**

---

### Action Items

| # | Item | Owner | Priority | Due | Status |
|---|------|-------|----------|-----|--------|
| AI-023 | Add migration drift check to TL arch doc checklist | TL | P0 | Sprint 7 | **New** |
| AI-024 | Track search_vector tech debt — use Prisma `Unsupported` type | TL/BE | P1 | Sprint 9 | **New** |
| AI-025 | Add SWR cache isolation pattern to MEMORY.md + FE test gotchas in arch doc | SM/TL | P1 | Sprint 7 | **New** |
| AI-026 | Add `vi.fn()` generic typing note to MEMORY.md | SM | P1 | Sprint 7 | **New** |
| AI-027 | Add supertest EPIPE multipart+auth pattern to MEMORY.md + QA prompt | SM/QA | P1 | Sprint 7 | **New** |
| AI-028 | Set up dedicated test DB (`webphim_test`) with `.env.test` | BE/QA | P1 | Sprint 7 | **New** |
| AI-029 | Add DB cleanup section (triggers/functions/views) to TL migration template | TL | P1 | Sprint 7 | **New** |
| AI-030 | Add multipart+auth testing pattern to QA prompt (no file on auth-fail) | SM | P1 | Sprint 7 | **New** |
| AI-031 | Plan Playwright E2E for Sprint 7+ integration testing | QA/TL | P2 | Sprint 7 | **New** |
| AI-032 | Sprint 7 player control design specs early from TL | TL | P1 | Sprint 7 | **New** |

---

### Prompt/Workflow Updates Needed

1. **TL_PROMPT.md** — Add: migration drift check to checklist, DB cleanup section for migrations, FE test gotchas section in arch doc
2. **QA_PROMPT.md** — Add: multipart+auth testing pattern (no file attachment on auth-fail tests), dedicated test DB setup in checklist
3. **BE_PROMPT.md** — Add: orphaned trigger check to pre-coding checklist, pre-migration cleanup for triggers/functions/views
4. **FE_PROMPT.md** — Add: SWR cache isolation in test setup (`provider:()=>new Map()`)
5. **MEMORY.md** — Add: SWR cache isolation, vi.fn() typing, supertest EPIPE multipart pattern, Prisma migration drift gotcha

---

### Lessons Learned (Saved to Memory)

1. **Prisma migration drift** — `prisma migrate dev` drops manually-added columns/indexes not in schema. Use `Unsupported` type for manual columns or maintain separate SQL migrations.
2. **SWR test caching** — SWR caches between tests causing false failures. Wrap test components with `SWRConfig` using `provider:()=>new Map()` for cache isolation.
3. **vi.fn() typing** — Vitest `vi.fn()` needs generic typing `vi.fn<(args) => ReturnType>()` to avoid TS errors in mocked function calls.
4. **Supertest EPIPE on multipart+auth** — When testing auth rejection on multipart endpoints, do NOT attach a file. The EPIPE occurs because supertest tries to stream the file body after the server already rejected with 401. Test auth separately, then test upload with valid auth.
5. **Orphaned PostgreSQL triggers** — Old manual triggers/functions can cause cryptic errors on new migrations. Check for orphaned DB objects before running `prisma migrate dev`.
6. **Arch doc quality compounds** — 4th consecutive sprint with zero clarification loops. Investment in thorough arch docs continues to pay dividends.

---

### Sprint 6 Velocity

| Metric | Value |
|--------|-------|
| Story Points Committed | 45 |
| Story Points Completed | 45 |
| Velocity | 45 pts/sprint |
| Tests Written | 73 (36 BE + 21 FE + 16 QA) |
| Tests Passing | 73 (100%) |
| Bugs Found | 0 |
| Regression | 142/142 pass |
| TL Review | All approved |
| Role Violations | 0 |

### Cumulative Velocity Trend

| Sprint | Points | Tests | Bugs |
|--------|--------|-------|------|
| Sprint 2 | 66 | 48 | 0 |
| Sprint 3+4 | 75 | 155 | 0 |
| Sprint 5 | 40 | 56 | 0 |
| Sprint 6 | 45 | 73 | 0 |
| **Total** | **226** | **332** | **0** |

---

## Sprint 5: Homepage & Browse UI

**Date:** 2026-02-08
**Note:** Sprint 5 was FE-only. No formal retro collected (accelerated to Sprint 6). Key items carried forward: visual verify (AI-022) caught double-unwrapping bug.

---

## Sprint 3+4: Landing/Layout (FE) + DB/Content API (BE+QA) — Parallel

**Date:** 2026-02-06
**Participants:** PO, SM, TL, FE, BE, QA
**Sprint Result:** 75/75 points (34 FE + 41 BE), 155 tests (23 FE + 90 BE + 42 QA), 0 bugs
**Facilitator:** SM

---

### What Went Well

| Member | Feedback |
|--------|----------|
| **BE** | 41pts zero bugs. TL arch doc excellent. Seed data solid. Full-text search production-ready. |
| **QA** | AI-010 game changer — wrote 42 tests before BE finished. Zero bugs. Test helpers pattern clean. 689ms total. |
| **TL** | Arch doc checklist eliminated Sprint 2 chaos. 75pts parallel execution perfect. Clean adherence to specs. Route order gotcha caught. |
| **FE** | TL arch doc eliminated guesswork. Commit-per-task clean. Framer Motion smooth. Reusable components. TL review passed first try. |
| **PO** | Parallel sprints 75/75, 0 bugs. All 12 Sprint 2 action items resolved. QA early involvement paid off. TL checklist enforced. |

**Key Themes:**
1. **TL arch doc checklist (AI-011)** — unanimously credited as the #1 improvement from Sprint 2 retro
2. **AI-010 (QA early arch doc)** — game changer, QA wrote 42 tests before BE finished (exceeded 35 plan)
3. **Perfect parallel execution** — Sprint 3 FE + Sprint 4 BE ran independently without conflicts
4. **All 12 Sprint 2 action items resolved** — process improvements proved effective

---

### What Didn't Go Well

| Member | Feedback |
|--------|----------|
| **BE** | CORS 2-round fix (array origin failed, needed callback). .env overrode defaults. Prisma seed config location. |
| **QA** | Nothing major. Test estimate off (35 planned vs 42 actual). |
| **TL** | PO edited cors.ts (ROLE VIOLATION). Minor code smells (adventure genre, rating sort, seed inaccuracy). |
| **FE** | Forgot unit tests initially, had to install test infra mid-sprint. Ugly SVG placeholders. Test setup bug (.tsx extension). |
| **PO** | PO violated role boundary by editing cors.ts. CORS multi-port not caught in Sprint 2 config. |

**Key Themes (by frequency):**
1. **PO ROLE VIOLATION** (ALL 5 members) — PO directly edited BE code (cors.ts) instead of delegating to BE. Unanimous agreement this must never happen again.
2. **CORS multi-origin config** (BE, PO - 2 members) — array origin failed, needed callback pattern. Not covered in arch doc.
3. **FE test setup mid-sprint** (FE - 1 member) — forgot to write tests with components initially
4. **Minor issues** — test estimate off, SVG placeholders, seed config location, .env overrides

---

### Improvement Suggestions

| Member | Suggestions |
|--------|-------------|
| **BE** | Check .env first for config issues. Test CORS with actual Origin header. .env.example updates. CORS callback for multi-origin. PO should report→BE fixes→BE tests→PO verifies. |
| **QA** | Integration tests for Sprint 5. Test data factory pattern. CI for regression. Verify test estimate vs actual. |
| **TL** | Validated query middleware pattern. Seed data review step. Sprint 5 arch doc include FE data fetching patterns. Keep AI-011 checklist. |
| **FE** | Write tests WITH each component. Visual verify before commit. EmailCapture shared component. Consider Storybook. DoD checklist reminder. |
| **PO** | PO NEVER touch code. Always delegate. Add CORS multi-port to TL arch doc checklist. |

---

### Role Violation Analysis (CRITICAL)

**Incident:** PO directly edited `webphim-be/src/middleware/cors.ts` to fix CORS origin issue instead of asking BE to fix it.

**Root Cause:** PO encountered CORS error during integration testing and felt urgency to fix it quickly rather than routing through BE.

**Impact:** Violated separation of responsibilities. All 5 members flagged this as a process issue.

**Resolution (unanimous):**
- **Hard rule:** No role edits code outside their domain. PO edits NOTHING.
- **Correct flow:** PO reports issue → BE investigates and fixes → BE tests → PO verifies
- **Even 1-line "urgent" fixes** go through the code owner
- **SM flags violations** going forward

---

### Action Items

| # | Item | Owner | Priority | Due | Status |
|---|------|-------|----------|-----|--------|
| AI-013 | NO cross-role code edits — hard rule in workflow | SM/PO | P0 | Sprint 5 | **New** |
| AI-014 | PO prompt: explicit "NEVER edit code files" rule | SM | P0 | Sprint 5 | **New** |
| AI-015 | SM flags role violations in real-time | SM | P0 | Sprint 5 | **New** |
| AI-016 | CORS multi-origin config in TL arch doc checklist | TL | P1 | Sprint 5 | **New** |
| AI-017 | FE write tests WITH each component (not after) | FE | P1 | Sprint 5 | **New** |
| AI-018 | Integration tests for Sprint 5 (FE↔BE) | QA/TL | P1 | Sprint 5 | **New** |
| AI-019 | BE keep dev server running throughout sprint | BE | P1 | Sprint 5 | **New** |
| AI-020 | TL add validated query middleware pattern to arch doc | TL | P1 | Sprint 5 | **New** |
| AI-021 | Seed data review step before QA testing | TL/BE | P2 | Sprint 5 | **New** |
| AI-022 | FE visual verify before commit | FE | P2 | Sprint 5 | **New** |

---

### Prompt/Workflow Updates Needed

1. **PO_PROMPT.md** — Add: NEVER edit code files directly. Always delegate to FE/BE. Report issue → owner fixes → owner tests → PO verifies.
2. **workflow.md** — Add: No cross-role code edits rule. SM flags violations. Correct escalation flow for urgent fixes.
3. **TL_PROMPT.md** — Add: CORS multi-origin in checklist. Validated query pattern. Seed data review step.
4. **FE_PROMPT.md** — Add: Write tests WITH each component. Visual verify before commit.
5. **BE_PROMPT.md** — Add: Keep dev server running. Check .env first for config issues.
6. **QA_PROMPT.md** — Add: Verify test estimate vs actual. Integration test planning.

---

### Lessons Learned (To Save to Memory)

1. **Role boundaries are sacred** — Even 1-line "urgent" fixes must go through the code owner. PO/SM never edit code.
2. **TL arch doc checklist works** — All Sprint 2 issues eliminated. Keep and expand the checklist.
3. **QA early involvement (AI-010) is a game changer** — QA exceeded test coverage by 20% and found 0 bugs because they had time to plan.
4. **CORS multi-origin needs callback pattern** — Array origin doesn't work in all Express CORS configs. Use callback function.
5. **Write tests WITH code, not after** — FE forgot tests initially, had to retrofit mid-sprint.

---

### Sprint 3+4 Velocity

| Metric | Sprint 3 (FE) | Sprint 4 (BE+QA) | Combined |
|--------|---------------|-------------------|----------|
| Story Points | 34 | 41 | 75 |
| Tasks | 9 | 11 | 20 |
| Tests | 23 | 132 (90+42) | 155 |
| Bugs Found | 0 | 0 | 0 |
| TL Review | Passed | Passed | Both |

---

## Sprint 2: Project Setup & Authentication

**Date:** 2026-02-06
**Participants:** PO, SM, TL, FE, BE, QA
**Sprint Result:** 66/66 points, 48/48 tests passing, all tracks complete
**Facilitator:** SM

---

### What Went Well

| Member | Feedback |
|--------|----------|
| **BE** | All 9 tasks done. Prisma7+Express5+Zod4 stack works. JWT solid. TL arch doc helped. |
| **QA** | 48/48 tests passing. Good coverage on all auth APIs. E2E confirmed. |
| **TL** | 66/66 pts. Parallel FE/BE effective. JWT architecture correct. Consistent tooling. |
| **FE** | Next.js14+Tailwind+Framer smooth. Netflix-style auth UI delivered. Zustand+Axios interceptor works. Route groups clean. |
| **PO** | 100% delivery. Communication via PO hub worked smoothly. 11-step workflow effective. |

**Key Themes:**
1. **100% delivery** - unanimous agreement, zero spillover
2. **Architecture-first approach** - TL doc enabled effective parallel development
3. **Tech stack validated** - Prisma7, Express5, Next.js14, Zustand all working well
4. **PO hub communication** - 11-step workflow proving effective

---

### What Didn't Go Well

| Member | Feedback |
|--------|----------|
| **BE** | Version compat issues (Prisma7 breaking changes, Express5 read-only req, Zod4 missing exports). Port 5000 macOS conflict. |
| **QA** | Wasted time writing tests without reading BE source first. Test DB not isolated causing flaky tests. No API docs - had to read source. |
| **TL** | Dependency version mismatches across team (Prisma7, Express5, Zod4, JWT types). Arch doc should have pinned versions. |
| **FE** | Port 5000 conflict. All FE in single commit instead of per-task. No FE unit tests. Empty components dir. |
| **PO** | Version gotchas consumed extra time. QA started late due to waiting on BE - could overlap more. |

**Key Themes (by frequency):**
1. **Version compatibility issues** (BE, QA, TL - 3 members) - Prisma7, Express5, Zod4, JWT types all had breaking changes
2. **Port 5000 conflict** (BE, FE, TL - 3 members) - macOS AirPlay blocks port 5000
3. **QA late start / no API docs** (QA, PO - 2 members) - QA couldn't start until BE done, no Swagger/OpenAPI
4. **FE commit discipline** (FE - 1 member) - all work in one commit, no FE unit tests
5. **Test DB not isolated** (QA - 1 member) - flaky tests from shared DB

---

### Improvement Suggestions

| Member | Suggestions |
|--------|-------------|
| **BE** | Pin exact versions in TL doc. Document known gotchas. Shared troubleshooting doc. BE check MEMORY.md. |
| **QA** | API contract/spec from TL before QA starts. Test env setup guide. Earlier QA involvement. QA receives TL arch doc. |
| **TL** | Pin versions BEFORE coding. API contracts in arch doc. Test DB config. Component tree for FE-heavy sprints. TL prompt mandate checklist. |
| **FE** | Commit per task. FE testing (Jest+RTL) in DoD. Extract reusable components early. Shared API contract doc. Consider Storybook. |
| **PO** | TL arch doc with pinned versions critical. API contracts enable parallel QA/FE. Clearer DoD per task. Enforce commit-per-task for all. |

---

### Action Items

| # | Item | Owner | Priority | Due | Status |
|---|------|-------|----------|-----|--------|
| AI-001 | TL arch doc FIRST before FE/BE start coding (enforce gate) | TL/PO | P0 | Sprint 3 | Pending |
| AI-002 | TL pins exact dependency versions in arch specs | TL | P0 | Sprint 3 | Pending |
| AI-003 | Standardize port 5001 in ALL docs and configs | TL/SM | P0 | Sprint 3 | Pending |
| AI-004 | QA reads BE source before writing tests | QA | P1 | Sprint 3 | Pending |
| AI-005 | TL provides component tree for FE-heavy sprints | TL | P1 | Sprint 3 | Pending |
| AI-006 | Separate test database for QA | BE/TL | P1 | Sprint 3 | Pending |
| AI-007 | API contracts (request/response format) in TL arch doc | TL | P0 | Sprint 3 | **New** |
| AI-008 | Enforce commit-per-task for all devs (FE+BE) | PO/SM | P1 | Sprint 3 | **New** |
| AI-009 | Add FE unit testing (Jest+RTL) to Definition of Done | TL/FE | P1 | Sprint 3 | **New** |
| AI-010 | QA receives TL arch doc at same time as FE/BE | PO | P1 | Sprint 3 | **New** |
| AI-011 | TL arch doc checklist: pinned versions, port, API contracts, test DB, component tree | TL/SM | P0 | Sprint 3 | **New** |
| AI-012 | All members check MEMORY.md for known gotchas before coding | All | P1 | Sprint 3 | **New** |

---

### Prompt/Workflow Updates Needed

1. **TL_PROMPT.md** - Add mandatory arch doc checklist: pinned versions, port 5001, API contracts (req/res format), test DB config, component tree for FE sprints
2. **BE_PROMPT.md** - Add: check MEMORY.md for version gotchas before coding
3. **QA_PROMPT.md** - Add: receive TL arch doc early for test planning, read BE source first, use separate test DB
4. **FE_PROMPT.md** - Add: commit per task, FE unit testing in DoD, lint before commit
5. **workflow.md** - Add: enforce commit-per-task, API contract requirement in arch doc, QA receives arch doc with FE/BE

---

### Lessons Learned (To Save to Memory)

1. **Pin exact dependency versions** - 3 members independently hit version compat issues (Prisma7, Express5, Zod4, JWT types). ~45min wasted across team.
2. **API contracts enable parallelism** - Without API contracts, QA had to wait for BE and read source code. Contracts would allow QA+FE to start earlier.
3. **Commit discipline** - Single large commits make review harder and lose granularity. Enforce commit-per-task.
4. **FE testing gap** - No FE unit tests in Sprint 2. Must add to DoD for Sprint 3.
5. **TL arch doc is the single most valuable artifact** - All members agree it enabled success. Must be comprehensive (checklist-driven).

---

### Sprint 2 Velocity

| Metric | Value |
|--------|-------|
| Story Points Committed | 66 |
| Story Points Completed | 66 |
| Velocity | 66 pts/sprint |
| Tests Written | 48 |
| Tests Passing | 48 (100%) |
| Blockers Encountered | 0 major |
| Tracks (BE/FE/TL/QA) | 4/4 complete |

---

## Sprint 1: Netflix Research

**Date:** 2026-02-06
**Note:** No formal retrospective conducted (retro process added after Sprint 1)
**Result:** 4/4 research reports delivered, all excellent quality
**Lesson:** Added mandatory Sprint Retrospective as Step 11 in workflow

---

## Sprint 0 (Setup)

*Team initialization - no retrospective needed*
