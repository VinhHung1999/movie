# SM Action Items

## Active Items (Sprint 9 Retro → Sprint 10)

### P0 - Critical

### AI-063: SERVER_BASE mandatory gotcha in EVERY arch doc + project memory
**Priority:** P0
**Owner:** TL / SM
**Due:** Sprint 10
**Status:** New

**Description:** SERVER_BASE (prepend BE host to image URLs) is a recurring FE bug — 3rd+ occurrence across sprints. FE, PO both flagged. Must be in arch doc known gotchas as mandatory item AND stored as permanent project memory lesson.

**Acceptance Criteria:**
- [ ] PROJECT MEMORY updated with SERVER_BASE lesson (permanent)
- [ ] TL arch doc template includes SERVER_BASE in mandatory gotchas section
- [ ] FE prompt references SERVER_BASE pre-commit check

### AI-064: QA browser checklist must verify CONTENT rendering, not just flow
**Priority:** P0
**Owner:** QA
**Due:** Sprint 10
**Status:** New

**Description:** Sprint 8: 5 Boss bugs missed. Sprint 9: 2 Boss bugs missed. Both times QA did browser walkthrough but only checked flow (can I click through?) not content (do thumbnails actually load? does input state reset?). QA, PO both flagged.

**Acceptance Criteria:**
- [ ] QA prompt updated: browser test must verify content renders (thumbnails visible, images load, real data shown)
- [ ] QA prompt updated: verify input state after navigation (inputs clear, expanded UI collapses)
- [ ] QA test plan template includes "Content Rendering Verification" section
- [ ] QA reads FE source for image URL patterns before browser test

---

### P1 - Important

### AI-065: Standard Zod-parse-in-controller convention
**Priority:** P1
**Owner:** BE / TL
**Due:** Sprint 10
**Status:** New

**Description:** BE controller bypassed Zod validation by using manual `as` casts on req.query. TL code review caught this. Standard convention: always use Zod schema.parse() output, never `as` cast raw request data.

**Acceptance Criteria:**
- [ ] BE prompt includes Zod-parse convention
- [ ] TL code review checklist includes "controller uses validated data" item

### AI-066: Shell env var cleanup step before DB operations
**Priority:** P1
**Owner:** BE
**Due:** Sprint 10
**Status:** New

**Description:** Shell DATABASE_URL environment variable overrode `.env` file during Prisma operations, causing confusion. BE should check/unset shell env vars before DB work.

**Acceptance Criteria:**
- [ ] BE prompt includes shell env var cleanup reminder
- [ ] Document: `unset DATABASE_URL` before `npx prisma migrate dev`

### AI-067: FE pre-commit mental checklist
**Priority:** P1
**Owner:** FE
**Due:** Sprint 10
**Status:** New

**Description:** Two recurring FE bugs: (1) img src missing SERVER_BASE, (2) navigation handler not resetting input state. Add pre-commit mental checklist to FE prompt.

**Acceptance Criteria:**
- [ ] FE prompt includes pre-commit checklist: SERVER_BASE on img src, nav state reset
- [ ] Checklist referenced before each commit

### AI-068: Arch doc single-source-of-truth
**Priority:** P1
**Owner:** TL
**Due:** Sprint 10
**Status:** New

**Description:** Pre-existing arch doc stub from a previous sprint caused confusion. Only one arch doc per sprint should exist. Delete stale stubs.

**Acceptance Criteria:**
- [ ] TL deletes stale arch doc stubs before creating new one
- [ ] Only `SPRINT_N_ARCHITECTURE.md` exists for current sprint

### AI-070: QA read FE source for image URL patterns + query dev DB
**Priority:** P1
**Owner:** QA
**Due:** Sprint 10
**Status:** New

**Description:** QA had 4 selector mismatches from guessing class names. QA should read FE source for actual patterns (image URLs, selectors, data-testid) and query dev DB for real data before browser testing.

### AI-071: TL code review checklist: validated data usage
**Priority:** P1
**Owner:** TL
**Due:** Sprint 10
**Status:** New

**Description:** TL code review should check that controllers use Zod-validated output, not raw `req.query` with `as` casts.

### AI-042: Fix transcode test timeouts (BullMQ → event-driven)
**Priority:** P1
**Owner:** BE
**Due:** Sprint 10
**Status:** **Carry (3rd sprint — originally Sprint 9, now Sprint 10)**

**Description:** 13 transcode test failures unresolved from Sprint 6/7. BullMQ polling inflates test run. TL explicitly requesting resolution in Sprint 10.

### AI-043: Split fast/slow test groups
**Priority:** P1
**Owner:** BE
**Due:** Sprint 10
**Status:** Carry

### AI-047: QA Dev Coverage Review formal step
**Priority:** P1
**Owner:** QA
**Due:** Sprint 10
**Status:** Carry (partial — QA showed awareness but no formal step)

### AI-053: Track TL review HIGH items as backlog
**Priority:** P1
**Owner:** PO
**Due:** Sprint 10
**Status:** Carry (partial)

### AI-060: Session expired messaging
**Priority:** P1
**Owner:** FE
**Due:** Sprint 10
**Status:** Carry (not verified in Sprint 9)

---

### P2 - Nice to Have

### AI-069: tsquery sanitization review
**Priority:** P2
**Owner:** TL / BE
**Due:** Sprint 10
**Status:** New

**Description:** Review edge cases for `websearch_to_tsquery` with user input — ensure no injection or unexpected behavior with special characters.

### AI-045: Shared renderWithSWR test helper
**Priority:** P2
**Owner:** FE
**Due:** Sprint 10
**Status:** Carry (deferred)

### AI-046: Nested SWR children test guidance
**Priority:** P2
**Owner:** SM
**Due:** Sprint 10
**Status:** Carry

### AI-051: Tech debt budget (3-5 pts/sprint)
**Priority:** P2
**Owner:** PO / TL
**Due:** Sprint 10
**Status:** Carry (TL requesting again)

### AI-037: QA -e2e suffix for test files
**Priority:** P2
**Owner:** QA
**Due:** Sprint 10
**Status:** Carry

### AI-027: Supertest EPIPE — QA prompt update
**Priority:** P2
**Owner:** SM
**Due:** Sprint 10+
**Status:** Carry

### AI-030: Multipart+auth — QA prompt update
**Priority:** P2
**Owner:** SM
**Due:** Sprint 10+
**Status:** Carry

### AI-031: Playwright E2E planning
**Priority:** P2
**Owner:** QA / TL
**Due:** Sprint 10+
**Status:** Carry

---

## Completed Items (Sprint 8 Retro → Verified in Sprint 9)

| # | Item | Verified |
|---|------|----------|
| AI-049 | ACCESSIBILITY in TL arch doc checklist | Sprint 9 arch doc Section 7 — full a11y specs for 5 components |
| AI-050 | TL verify infra assumptions in arch doc v1 | Sprint 9 arch doc Section 16 — 12 checks documented |
| AI-024 | search_vector tech debt (Prisma Unsupported) | Task 9.1: `Unsupported("tsvector")?` in schema.prisma. Both DBs restored. |
| AI-055 | BOSS APPROVAL GATE | Boss tested Sprint 9 in browser. Found 2 bugs. Fixed. Approved. Process works. |
| AI-057 | Fix Sprint 8 thumbnail URL bug | Fixed prior to Sprint 9 |
| AI-058 | Fix content not showing on Home | Fixed prior to Sprint 9 |
| AI-059 | Fix Preview Modal hover clipped | Fixed prior to Sprint 9 |
| AI-061 | Boss account persistence | Boss tested with boss@webphim.com — account survived Sprint 9 |
| AI-038 | Boss account in seed script | Boss account survived migration + tests |

## Completed Items (Sprint 7 Retro → Verified in Sprint 8)

| # | Item | Verified |
|---|------|----------|
| AI-028 | Set up dedicated test DB (`webphim_test`) | Task 8.7 delivered. Dev DB preserved. All members confirm. |
| AI-033 | Fix pre-existing test failures | Task 8.8: all 161 tests pass against webphim_test |
| AI-034 | React 19 lint gotchas in MEMORY.md + arch doc | MEMORY.md + Sprint 8 arch doc Section 11 |
| AI-035 | Pre-existing test health check in TL arch doc | Sprint 8 arch doc Section 4a — 161/161 baseline |
| AI-036 | E2E test strategy in TL arch doc | Sprint 8 arch doc Section 4b — 5-layer strategy |
| AI-040 | Merge tightly coupled tasks in planning | Sprint 8 tasks cleanly scoped, no empty tasks |
| AI-041 | Zod uuid() all-zero pattern documented | MEMORY.md has entry |
| AI-025 | SWR cache isolation in TL arch doc | Sprint 8 arch doc Section 4 FE tests |
| AI-026 | vi.fn() typing in TL arch doc | Sprint 8 arch doc Section 11 gotchas |

## Completed Items (Sprint 6 Retro → Verified in Sprint 7)

| # | Item | Verified |
|---|------|----------|
| AI-023 | Migration drift check in TL checklist | Sprint 7 arch doc Section 2 — found orphaned trigger |
| AI-029 | DB cleanup section in TL template | Sprint 7 arch doc Section 2 has cleanup SQL |
| AI-032 | Sprint 7 player control specs early | Sprint 7 arch doc Section 6 has full specs |

## Completed Items (Sprint 3+4 Retro → Verified in Sprint 6)

| # | Item | Verified |
|---|------|----------|
| AI-013 | NO cross-role code edits — hard rule | Zero violations Sprint 5-9 |
| AI-014 | PO prompt: NEVER edit code files | No violations |
| AI-015 | SM flags role violations in real-time | SM monitoring active |
| AI-016 | CORS multi-origin config in TL checklist | Sprint 6+ arch docs |
| AI-017 | FE write tests WITH each component | FE delivered tests alongside |
| AI-018 | Integration tests | QA integration tests, first-time pass |
| AI-019 | BE keep dev server running | Server on 5001 throughout |
| AI-020 | Validated query middleware pattern | Sprint 6-9 arch docs |
| AI-021 | Seed data review step | Included in arch docs |
| AI-022 | FE visual verify before commit | Catching real bugs |

## Completed Items (Sprint 2 Retro → Verified in Sprint 3+4)

| # | Item | Verified |
|---|------|----------|
| AI-001 | TL arch doc FIRST before FE/BE start coding | Enforced every sprint |
| AI-002 | TL pins exact dependency versions | Pinned in every arch doc |
| AI-003 | Standardize port 5001 | Used throughout |
| AI-004 | QA reads BE source before writing tests | QA confirmed |
| AI-005 | TL provides component tree for FE-heavy sprints | Full trees Sprint 5-9 |
| AI-006 | Separate test database for QA | Delivered Sprint 8 (AI-028) |
| AI-007 | API contracts in TL arch doc | Every sprint |
| AI-008 | Enforce commit-per-task for all devs | Verified by TL |
| AI-009 | Add FE unit testing to DoD | FE tests in every sprint |
| AI-010 | QA receives arch doc at same time as FE/BE | Standard practice |
| AI-011 | TL arch doc checklist | SM verifies every sprint |
| AI-012 | All members check MEMORY.md | Standard practice |
