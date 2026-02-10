# Team

Team structure and workflow documentation.

**Full details:** `docs/tmux/webphim-team/workflow.md`

## Boss Account (CRITICAL - DO NOT DELETE)

- Account: boss@webphim.com / Boss@123456 / name=Boss
- MUST be in seed file so it survives re-seeds
- Tests MUST use webphim_test DB only — NEVER wipe dev DB users
- Boss lost account 5 times before test DB isolation was implemented

## Port Configuration

| Service | Port | Notes |
|---------|------|-------|
| FE (Next.js) | 1999 | Changed from 3000, Boss preference |
| BE (Express) | 5001 | macOS AirPlay blocks 5000 |
| PostgreSQL | 5432 | |
| Redis | 6379 | For BullMQ transcode queue |

## Workflow Updates

### Sprint Retrospective added (Sprint 1 lesson)
- Workflow expanded from 10-step to **11-step** - Step 11 is mandatory Sprint Retrospective
- SM facilitates, PO collects feedback, all members participate
- Retro outputs: action items, prompt updates, memory updates
- All 6 role prompts updated with retro responsibilities
- Reason: Sprint 1 had no retro → missed opportunity for process improvement

### Boss Approval Gate added (Sprint 8 lesson)
- Workflow expanded to **13-step** - Steps 10 (QA browser test) + 12 (Boss approval)
- No sprint closes without Boss testing in real browser
- Boss must login (boss@webphim.com) and verify all features work

### QA testing must include live browser E2E (Sprint 8 lesson)
- QA must run Playwright tests on localhost:1999 (with login) before reporting PASS
- Unit tests alone are insufficient — they mock APIs/DOM and miss real integration issues
- Must capture screenshots as evidence for PO/Boss
- QA workflow: unit tests → live browser E2E with auth → screenshot evidence → report

## Memory Location
- Project memory: `/Users/phuhung/Documents/Studies/AIProjects/webphim/.claude/memory/`
- This is the ONLY memory location. All team members use this.
