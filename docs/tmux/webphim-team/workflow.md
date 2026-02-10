# WebPhim Team - Netflix Clone Workflow

## Overview

Team phát triển WebPhim - một nền tảng xem phim giống Netflix.

**Tech Stack:**
- Frontend: Next.js 14+, React, Tailwind CSS, Framer Motion
- Backend: Node.js/Express hoặc Next.js API Routes
- Database: PostgreSQL/MongoDB
- Streaming: HLS/DASH video streaming
- Auth: NextAuth.js

## Team Roles

| Role | Responsibility |
|------|----------------|
| PO | Product Owner - Backlog management, priorities, acceptance |
| SM | Scrum Master - Process improvement, blocker removal |
| TL | Tech Lead - Architecture, technical decisions, code review |
| FE | Frontend - UI/UX, React components, responsive design |
| BE | Backend - API, database, video streaming, authentication |
| QA | Tester - Testing, quality assurance, bug tracking |

## Communication Protocol

### PO is the Hub
- Tất cả communication đi qua PO
- Không giao tiếp trực tiếp giữa FE ↔ BE ↔ QA
- SM hỗ trợ process, TL hỗ trợ technical

### Message Format
```
[ROLE] [HH:mm]: [Brief message]. See [reference].
```

### Two-Enter Rule
Khi gửi tin nhắn qua tmux, luôn dùng 2 lệnh riêng biệt:
```bash
tmux send-keys -t [pane_id] "message" C-m
tmux send-keys -t [pane_id] C-m
```

Hoặc dùng `tm-send`:
```bash
tm-send -s webphim_team PM "FE -> PM: Task complete"
```

## 13-Step Sprint Workflow (Updated Sprint 8 — Boss Approval Gate)

1. **Boss → PO**: Boss cung cấp requirements
2. **PO → TL**: TL creates architecture doc. **MUST include:** pinned versions, API contracts (req/res), port 5001, test DB config, component tree (if FE-heavy), known gotchas from project memory (`.claude/memory/bugs-and-lessons/`), **ACCESSIBILITY section (AI-049)**. SM verifies checklist before PO approves.
3. **PO approves TL doc** → **PO → FE/BE/QA**: Assign tasks với specs + architecture doc. **QA receives arch doc simultaneously** for early test planning (AI-010).
4. **FE**: Implement UI components (MUST wait for TL doc). Check project memory (`.claude/memory/`) first. **Commit per task.** Write unit tests (Jest+RTL).
5. **BE**: Implement API và services (MUST wait for TL doc, use port 5001). Check project memory (`.claude/memory/`) first. **Commit per task.**
6. **FE ↔ PO ↔ BE**: Clarification loop
7. **Integration**: FE + BE integration
8. **FE/BE → PO**: Sprint completion report. PO verifies commit-per-task discipline.
9. **PO → QA**: Request testing (QA already has arch doc + test plan from step 3)
10. **QA BROWSER TEST (AI-056)**: QA must do **real browser walkthrough** of ALL new features + regression check. Not just unit/integration tests. Report with screenshots or checklist.
11. **QA → PO → FE/BE**: Bug fixes và approval. TL code review.
12. **BOSS APPROVAL (AI-055)**: **MANDATORY.** Boss tests in real browser. Boss approves or rejects. If rejected → fix bugs → re-test → Boss re-approves. **No sprint closes without Boss acceptance.**
13. **Sprint Retrospective**: SM facilitates, toàn team tham gia

> **WARNING (Sprint 8 Lesson):** "0 bugs from QA" does NOT mean the sprint is ready. Sprint 8 had 350 passing tests and "0 QA bugs" but Boss found 5 real bugs in browser. Unit tests test code — they do NOT test user experience.

## Definition of Done (per task)

All developers (FE + BE) must meet these criteria per task:
- [ ] Code implemented per TL architecture doc
- [ ] Tests written and passing
- [ ] Lint passes
- [ ] **One commit per task** with clear message (AI-008)
- [ ] Reported to PO

## Definition of Done (per sprint) — AI-062

**ALL of the following before sprint can close:**
- [ ] All tasks meet per-task DoD above
- [ ] QA unit/integration tests pass
- [ ] **QA real browser walkthrough** — click through ALL new features in actual browser (AI-056)
- [ ] TL code review approved
- [ ] **BOSS APPROVAL** — Boss tests in real browser and approves (AI-055)
- [ ] Boss account (boss@webphim.com) verified still working
- [ ] Sprint retrospective completed

## Sprint Retrospective (Step 11 - Mandatory)

Cuối mỗi sprint, SM tổ chức Sprint Retrospective:

### Process
1. **SM hỏi từng member** qua PO: What went well? What didn't? Suggestions?
2. **Mỗi member gửi feedback** về PO → SM tổng hợp
3. **SM phân tích** và tạo action items
4. **Review & update prompts** - Cập nhật role prompts nếu cần cải thiện
5. **Review & update memory** - Lưu lessons learned vào project memory
6. **SM ghi log** vào `docs/tmux/webphim-team/sm/RETROSPECTIVE_LOG.md`
7. **Action items** tracked trong `docs/tmux/webphim-team/sm/ACTION_ITEMS.md`

### Output
- Updated RETROSPECTIVE_LOG.md
- Updated ACTION_ITEMS.md
- Updated role prompts (nếu cần)
- Updated project memory (lessons learned)

### Questions Template
```
1. What went well this sprint?
2. What didn't go well?
3. What should we improve for next sprint?
4. Any blockers or process issues?
5. Any prompt/workflow changes needed?
```

## WHITEBOARD

PM maintains WHITEBOARD.md với:
- Current sprint status
- Active tasks
- Blockers
- Team status

## Netflix Clone Features (Roadmap)

### Phase 1: Core
- [ ] User authentication (signup, login, logout)
- [ ] Movie/Series catalog browsing
- [ ] Search functionality
- [ ] Video player (basic)

### Phase 2: Enhanced
- [ ] User profiles
- [ ] Watchlist / My List
- [ ] Continue watching
- [ ] Categories/Genres

### Phase 3: Advanced
- [ ] Recommendations
- [ ] Multiple profiles per account
- [ ] Responsive design (mobile, tablet, TV)
- [ ] Admin panel

## Role Boundary Rule (Sprint 3+4 Retro - AI-013)

**HARD RULE: No cross-role code edits.**

- Each role ONLY edits code in their domain:
  - **FE** edits `webphim-fe/` only
  - **BE** edits `webphim-be/` only
  - **QA** edits test files only
  - **TL** reviews code, writes architecture docs
  - **PO** edits NO code files — manages backlog, WHITEBOARD, assigns tasks
  - **SM** edits NO code files — manages process docs, retro logs, action items

- **For urgent fixes:** Report issue → code owner fixes → owner tests → reporter verifies
- **SM flags violations** immediately when detected
- **No exceptions** — even 1-line fixes go through the code owner

## Git Workflow

- `main` - production ready
- `develop` - integration branch
- `feature/*` - feature branches
- Commits show progress, not chat logs
