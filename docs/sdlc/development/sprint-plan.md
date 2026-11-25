# Sprint Plan

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start sprints -->
## Sprint 1: Sprint 1

Stand up the shared task store and deliver add-task and list-view (newest-first, empty-state, anonymous, persistent).

Capacity: 20 points · Committed: 17

| Key | Type | Title | Points | Role | Depends on |
|---|---|---|---|---|---|
| US-001 | Story | Add a task with a title | 5 | backend-agent | — |
| US-002 | Story | Task data is limited to title, status and creation time | 2 | backend-agent | US-001 |
| US-003 | Story | See all tasks newest-first | 3 | frontend-agent | US-001 |
| US-004 | Story | See an empty-state message when there are no tasks | 2 | frontend-agent | US-003 |
| US-005 | Story | The list is shared globally across all visitors | 2 | frontend-agent | US-001, US-003 |
| US-009 | Story | Tasks persist across sessions and devices | 2 | devops-agent | US-001 |
| US-010 | Story | Use the app anonymously with no sign-in and no payment | 1 | frontend-agent | — |

## Sprint 2: Sprint 2

Deliver mark-done/toggle-back and confirmed delete on the shared list.

Capacity: 20 points · Committed: 10

| Key | Type | Title | Points | Role | Depends on |
|---|---|---|---|---|---|
| US-006 | Story | Mark a task as done | 3 | backend-agent | US-001, US-003 |
| US-007 | Story | Toggle a done task back to not-done | 2 | backend-agent | US-006 |
| US-008 | Story | Delete a task after confirming | 5 | frontend-agent | US-001, US-003 |

## Unscheduled

_Nothing unscheduled._
<!-- sdlc:auto:end sprints -->
