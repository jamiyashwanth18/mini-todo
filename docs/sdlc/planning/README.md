# Planning

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
### EPIC-001 · approved · source: planning:EPIC-001

Lets any anonymous visitor add a task with a required title (up to 100 characters) to the single shared list. Delivered in sprint 1; a task holds only a title, done/not-done status, and creation timestamp.

Goal: enable adding tasks to the shared global list with minimal task data (title, status, creation timestamp only), delivered alongside list-viewing in sprint 1. No due dates, priorities, categories, descriptions, or title editing are in scope.

**Related:** US-001, US-002

### EPIC-002 · approved · source: planning:EPIC-002

Lets all visitors view one shared global task list ordered newest-first, with an empty-state message when no tasks exist. Delivered in sprint 1.

Goal: provide a shared, newest-first view of all tasks with a clear empty-state, and confirm the list is global (not per-account) so any visitor can see and act on the same tasks.

**Related:** US-003, US-004, US-005

### EPIC-003 · approved · source: planning:EPIC-003

Lets a visitor mark a task as done (shown struck through) and toggle it back to not-done. Delivered in sprint 2; done tasks stay in place in the list rather than being moved or hidden.

Goal: deliver reversible done/not-done status toggling on the shared list, with changes visible to all visitors, as part of sprint 2.

**Related:** US-006, US-007

### EPIC-004 · approved · source: planning:EPIC-004

Lets a visitor delete a task from the shared list, but only after confirming, to prevent accidental removal. Delivered in sprint 2.

Goal: provide a confirmed delete flow so tasks can be permanently removed from the shared list without accidental loss, including correctly showing the empty-state when the last task is deleted.

**Related:** US-008

### EPIC-005 · approved · source: planning:EPIC-005

Ensures the shared list persists server-side across sessions and devices, and that the app requires no sign-in, no accounts, and no payment.

Goal: back the shared list with server-side/database persistence so tasks survive across sessions and devices, and guarantee anonymous, free access with no sign-in or billing of any kind.

**Related:** US-009, US-010

### SPRINT-1 · approved · source: planning:SPRINT-1

Sprint 1 goal: stand up the shared task store and deliver add-task and list-view (newest-first, empty-state, anonymous, persistent). Capacity: 20 points.

Plan v1 (approved) assigns: EPIC-001 (epic, unassigned); US-001 Add a task with a title (5 pts, backend-agent); US-002 Task data is limited to title, status and creation time (2 pts, backend-agent); EPIC-002 (epic, unassigned); US-003 See all tasks newest-first (3 pts, frontend-agent); US-004 See an empty-state message when there are no tasks (2 pts, frontend-agent); US-005 The list is shared globally across all visitors (2 pts, frontend-agent). Total assigned story points: 14 of 20 capacity.

**Related:** EPIC-001, US-001, US-002, EPIC-002, US-003, US-004, US-005

### SPRINT-2 · approved · source: planning:SPRINT-2

Sprint 2 goal: deliver mark-done/toggle-back and confirmed delete on the shared list. Capacity: 20 points.

Plan v1 (approved) assigns: EPIC-003 (epic, unassigned); US-006 Mark a task as done (3 pts, backend-agent); US-007 Toggle a done task back to not-done (2 pts, backend-agent); EPIC-004 (epic, unassigned); US-008 Delete a task after confirming (5 pts, frontend-agent); EPIC-005 (epic, unassigned); US-009 Tasks persist across sessions and devices (2 pts, devops-agent); US-010 Use the app anonymously with no sign-in and no payment (1 pt, frontend-agent). Total assigned story points: 13 of 20 capacity.

**Related:** EPIC-003, US-006, US-007, EPIC-004, US-008, EPIC-005, US-009, US-010
<!-- sdlc:auto:end narrative -->
