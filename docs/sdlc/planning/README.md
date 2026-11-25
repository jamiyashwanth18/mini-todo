# Planning

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
### EPIC-001 · approved · source: planning:EPIC-001

Any anonymous visitor can add a task (required title up to 100 characters) to the single global list; delivered in sprint 1 alongside listing tasks.

A task holds only a title, a done/not-done status (not-done at creation), and a creation timestamp used for ordering -- no due dates, priorities, categories, or descriptions.

**Related:** US-001, US-002

### EPIC-002 · approved · source: planning:EPIC-002

All visitors share one global task list, shown newest-first by creation timestamp, with an empty-state message when there are none. Delivered in sprint 1.

**Related:** US-003, US-004, US-005

### EPIC-003 · approved · source: planning:EPIC-003

A visitor can mark any task done (shown struck through) and toggle it back to not-done, without moving or hiding it in the list. Delivered in sprint 2.

**Related:** US-006, US-007

### EPIC-004 · approved · source: planning:EPIC-004

A visitor can delete any task from the shared list, but only after a confirmation step to avoid accidental removal. Delivered in sprint 2.

**Related:** US-008

### EPIC-005 · approved · source: planning:EPIC-005

Tasks are stored server-side so the shared global list persists across sessions and devices; the app requires no sign-in/accounts and is entirely free.

No explicit sprint assignment given for this epic in the input; it underpins both sprints as a cross-cutting requirement.

**Related:** US-009, US-010

### SPRINT-1 · approved · source: planning:EPIC-001,EPIC-002

Sprint 1 covers adding a task and listing tasks.

Per epic descriptions: EPIC-001 (add a task) and EPIC-002 (view the shared global task list, newest-first, with empty-state) are 'delivered in sprint 1.'

**Related:** EPIC-001, EPIC-002

### SPRINT-2 · approved · source: planning:EPIC-003,EPIC-004

Sprint 2 covers marking tasks done/not-done and deleting tasks with confirmation.

Per epic descriptions: EPIC-003 (mark done / toggle back) and EPIC-004 (delete with confirmation) are 'delivered in sprint 2.'

**Related:** EPIC-003, EPIC-004
<!-- sdlc:auto:end narrative -->
