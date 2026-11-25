# Traceability Matrix

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start legend -->
Built from recorded links, not written by a model: requirement key → plan item (`source_stable_key`) → development ticket (`stable_key`) → the ticket's test steps → the last live deployment that started after the work finished. **AC tests** counts the story's acceptance criteria that have a test case, and those whose test cases all passed in the latest finished E2E run. **Tests** counts the tests written for the story, and **Result** how many last passed, how many failed and when, as of this page's generation; the Documentation tab shows them live.
<!-- sdlc:auto:end legend -->

<!-- sdlc:auto:start matrix -->
| Requirement | Epic | Title | Plan items | Sprint | Design | Code | Commits | Ticket | Test step | Tests | Result | AC tests | Deployed |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| US-001 | EPIC-001 | Add a task with a title | US-001 | 1 | POST /tasks, api, db, tasks, web | — | — | not started | not run | 0 | No tests | 0/4 tested · 0/4 passing | — |
| US-002 | EPIC-001 | Task data is limited to title, status and creation time | US-002 | 1 | api, db, tasks | — | — | not started | not run | 0 | No tests | 0/2 tested · 0/2 passing | — |
| US-003 | EPIC-002 | See all tasks newest-first | US-003 | 1 | GET /tasks, api, tasks, web | — | — | not started | not run | 0 | No tests | 0/2 tested · 0/2 passing | — |
| US-004 | EPIC-002 | See an empty-state message when there are no tasks | US-004 | 1 | tasks, web | — | — | not started | not run | 0 | No tests | 0/2 tested · 0/2 passing | — |
| US-005 | EPIC-002 | The list is shared globally across all visitors | US-005 | 1 | api, db, tasks, web | — | — | not started | not run | 0 | No tests | 0/2 tested · 0/2 passing | — |
| US-006 | EPIC-003 | Mark a task as done | US-006 | 2 | PATCH /tasks/{id}, api, db, tasks, web | — | — | not started | not run | 0 | No tests | 0/2 tested · 0/2 passing | — |
| US-007 | EPIC-003 | Toggle a done task back to not-done | US-007 | 2 | PATCH /tasks/{id}, api, tasks, web | — | — | not started | not run | 0 | No tests | 0/1 tested · 0/1 passing | — |
| US-008 | EPIC-004 | Delete a task after confirming | US-008 | 2 | DELETE /tasks/{id}, api, db, tasks, web | — | — | not started | not run | 0 | No tests | 0/4 tested · 0/4 passing | — |
| US-009 | EPIC-005 | Tasks persist across sessions and devices | US-009 | 1 | api, db, tasks | — | — | not started | not run | 0 | No tests | 0/2 tested · 0/2 passing | — |
| US-010 | EPIC-005 | Use the app anonymously with no sign-in and no payment | US-010 | 1 | web | — | — | not started | not run | 0 | No tests | 0/2 tested · 0/2 passing | — |
<!-- sdlc:auto:end matrix -->
