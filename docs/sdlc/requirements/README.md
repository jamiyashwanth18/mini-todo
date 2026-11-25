# Product Requirements

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
## Summary

### REQ-001 · approved · source: requirements:technology-stack

Product owner approved an exact technology stack: FastAPI backend, AWS cloud, PostgreSQL database, React frontend. No substitutions permitted.

- Backend: FastAPI 0.115 -- builds the few endpoints needed (add task, list newest-first, toggle done, delete) and enforces the 100-character title rule in one place; fits the two-sprint plan; platform default.
- Cloud: AWS -- hosts the server and shared database so the global list is reachable from any visitor's device; platform default; light traffic fits a small inexpensive setup.
- Database: PostgreSQL 16 -- stores the single task table (title, done flag, creation time) reliably and sorts by creation time with no effort; platform default.
- Frontend: React 19 -- renders the single screen (add box, newest-first list with empty state, per-task toggle/delete controls) and re-renders cleanly as the shared list changes; platform default.

### REQ-002 · approved · source: requirements:technology-stack

The app relies on two backing services: AWS-hosted compute/hosting and a PostgreSQL database service, both needed to keep the one shared list reachable and persistent.

- Hosting/compute service (AWS): keeps the small FastAPI server available to every visitor's device; sized for light traffic in a small, inexpensive setup.
- Database service (PostgreSQL 16 on AWS): persists the shared task list server-side so it survives across sessions and devices.

**Related:** REQ-001

### REQ-003 · approved · source: requirements:scope

Scope is deliberately narrow: a single shared anonymous to-do list with add/mark-done/delete only; user accounts and sign-in are explicitly excluded.

In scope:
- Add a task with a required title up to 100 characters.
- Single shared global task list ordered newest-first.
- Empty-state message when there are no tasks.
- Mark a task done (struck through), toggleable back to not-done.
- Delete a task after a confirmation step.
- Server-side storage so the shared list persists across sessions and devices.
- Anonymous access for every visitor, no accounts or sign-in.
- Free app, no payments, billing, or subscriptions.
- A task holds only a title, a done/not-done status, and a creation time.
- No editing of an existing task's title (only add, mark done, delete).
- Any visitor can add, mark done, or delete any task.

Out of scope:
- User accounts / sign-in.

### REQ-004 · approved · source: requirements:feature:adding-a-task

Covers how a task is created: required title (1-100 characters), default not-done status, creation timestamp, and the intentional absence of editing or extra fields.

- Add a task with a title: visitor types a title of 1-100 characters and submits; task is created not-done with a creation time and appears at the top of the shared list; input is cleared afterward.
- Require a title: empty or whitespace-only titles are rejected with a message that a title is required.
- Limit title to 100 characters: visitor is stopped from exceeding 100 characters and is clearly shown the maximum allowed.
- Keep tasks minimal, no editing: a task holds only title, done/not-done status, and creation time -- no due dates, priorities, categories, descriptions, and no option to edit an existing title.

### REQ-005 · approved · source: requirements:feature:the-task-list

Covers how the shared list is displayed: newest-first ordering, an empty-state message, and the fact that the list is global and editable by anyone.

- See tasks newest-first: all tasks shown in one list ordered by creation time, newest at top.
- Empty-state message: when there are no tasks, a clear 'no tasks yet' message is shown instead of a blank screen; it is replaced by the list once the first task is added.
- One shared global list: everyone works from the same list; a task added by one visitor is visible to any other visitor on a different session or device; any visitor may add, mark done, or delete any task.

### REQ-006 · approved · source: requirements:feature:completing-tasks

Covers marking tasks done and reversing that, with the task staying in its original list position either way.

- Mark a task done: a not-done task can be marked done; it is shown struck through while staying in the same position in the list, and the change is saved so other visitors see it as done.
- Toggle a task back to not-done: a done task can be changed back to not-done; it is no longer struck through and remains in the same place in the list.

### REQ-007 · approved · source: requirements:feature:deleting-tasks

Covers deletion with a mandatory confirmation step and the resulting empty-state behavior when the last task is removed.

- Delete a task after confirming: visitor is asked to confirm before deletion; confirming permanently removes the task from the shared list for everyone; cancelling leaves the task unchanged; deleting the last task shows the empty-state message.

### REQ-008 · approved · source: requirements:feature:access-storage

Covers server-side persistence of the shared list and fully anonymous, free access with no sign-up or payment barriers.

- Tasks persist server-side: stored in a database so the shared list survives across sessions and devices; returning later or using another device shows the same persisted list.
- Anonymous, free access: no account, sign-in, or registration needed; app is free with no payments, billing, or subscriptions; any visitor can use every feature immediately.

### REQ-009 · approved · source: requirements:NFR-001

Privacy NFR, accepted risk: the shared list is fully public with no ownership or access control on individual tasks.

By design there are no accounts or sign-in, so the one global list is public: any anonymous visitor can see every task and can add, mark done, or delete any task, with no ownership or privacy protection on tasks people create. Marked as an accepted risk.

### REQ-010 · approved · source: requirements:NFR-002

Availability NFR: the shared list must remain reachable and consistent across sessions and devices via server-side storage.

Tasks are stored server-side so the single global list is reachable from any visitor's device, and the same tasks remain present after the app is closed and reopened in a new session or opened on another device.

### REQ-011 · approved · source: requirements:NFR-003

Usability NFR: there must be zero barriers (no sign-in, account, registration, or payment) to using any feature immediately.

Any visitor can add, mark done, or delete tasks immediately on first visit with no sign-in, no account, no registration, and no request for payment, billing, or subscription.
<!-- sdlc:auto:end narrative -->

<!-- sdlc:auto:start summary -->
**Requirements version:** v1  
**Delivery scope:** lightweight  
**Approved:** 2026-11-25

**Capabilities in scope:** Add a task with a required title of up to 100 characters, Single shared global task list ordered newest-first, Empty-state message when there are no tasks, Mark a task done (struck through), toggleable back to not-done, Delete a task after a confirmation step, Server-side storage so the shared list persists across sessions and devices, Anonymous access for every visitor, with no accounts or sign-in, Free app with no payments, billing or subscriptions, A task holds only a title, a done/not-done status and a creation time, Editing a task's title is not supported — only add, mark done and delete, Any visitor can add, mark done or delete any task on the shared list

**Approved technology stack:**

| Layer | Choice | Rationale |
|---|---|---|
| backend | FastAPI | The server's whole job is a handful of simple actions on the shared list: add a task (title required, max 100 characters), return all tasks newest-first, toggle a task's done status, and delete a task. FastAPI lets you build these few endpoints quickly and enforce the 100-character title rule in one place, which fits the two-sprint plan -- add/list first, then mark-done/delete. It is the platform default and sized right for this. |
| cloud | AWS | The app needs somewhere dependable to host the small server and the shared database so the global list is always reachable from any visitor's device. AWS covers both and is the platform default; for traffic this light it will sit comfortably in a small, inexpensive setup. |
| database | PostgreSQL | You confirmed tasks are stored server-side so the one shared list survives across sessions and devices. A task is just a title, a done flag, and a creation time used for newest-first ordering -- a single table. PostgreSQL stores that reliably and sorts by creation time with no effort, and it is the platform default, so there is no reason to reach for anything else. |
| frontend | React | Mini Todo is a single screen: a text box to add a task, a list showing tasks newest-first with an empty-state message, and per-task controls to toggle done and confirm-then-delete. React handles exactly this kind of live-updating list well, and since any visitor's change affects the one shared global list, the screen needs to re-render cleanly as tasks come and go. It is the platform default and more than enough for a page this small. |
<!-- sdlc:auto:end summary -->

<!-- sdlc:auto:start epics -->
## EPIC-001: Add a task to the shared list

Any anonymous visitor can add a task to the single global list by providing a required title of up to 100 characters. This is delivered in sprint 1 alongside listing tasks. A task holds only a title, a done/not-done status (not-done when created), and a creation timestamp used for ordering — no due dates, priorities, categories, or descriptions.

### US-001: Add a task with a title

**Priority:** critical

> As a anonymous visitor, I want to add a task by entering a title, so that it appears on the shared to-do list for everyone to see.

| ID | Given | When | Then |
|---|---|---|---|
| AC-001 | I am on the Mini Todo page | I enter a title of 1 to 100 characters and submit | a new task is created with that title, a not-done status, and a creation timestamp, and it appears on the shared list |
| AC-002 | I am on the Mini Todo page | I submit with an empty title (or only whitespace) | the task is not created and I see a message that a title is required |
| AC-003 | I am entering a title | I try to submit a title longer than 100 characters | the task is not created and I am prevented from exceeding the 100-character limit with a clear indication of the maximum |
| AC-004 | a task has been added successfully | the add completes | the input is ready for the next entry and the newly added task is shown at the top of the list as newest-first |

### US-002: Task data is limited to title, status and creation time

**Priority:** medium

> As a product owner, I want each task to hold only a title, a done/not-done status, and a creation timestamp, so that the product stays intentionally minimal and editing of existing titles is not offered.

| ID | Given | When | Then |
|---|---|---|---|
| AC-005 | a task is created | I inspect what is stored for it | only a title, a done/not-done status, and a creation timestamp are recorded — no due date, priority, category, or description |
| AC-006 | a task already exists on the list | I look for a way to edit its title | no edit option is offered, because editing an existing task's title is not supported (assumption: only add, mark done, and delete are supported) |

## EPIC-002: View the shared global task list

All visitors share one global list. Tasks are shown newest-first based on their creation timestamp, with an empty-state message when there are none. Delivered in sprint 1.

### US-003: See all tasks newest-first

**Priority:** critical

> As a anonymous visitor, I want to see all tasks in a single list ordered newest-first, so that I can read the most recently added tasks at the top.

| ID | Given | When | Then |
|---|---|---|---|
| AC-007 | one or more tasks exist on the shared list | I open the app | I see all tasks in a single list ordered by creation time with the newest at the top |
| AC-008 | the list contains both done and not-done tasks | I view the list | done tasks remain in the same list ordered newest-first and are not moved or hidden (assumption: done tasks stay in place, shown struck through) |

### US-004: See an empty-state message when there are no tasks

**Priority:** high

> As a anonymous visitor, I want to see a clear message when the list is empty, so that I understand there are no tasks yet rather than seeing a blank screen.

| ID | Given | When | Then |
|---|---|---|---|
| AC-009 | no tasks exist on the shared list | I open the app | I see an empty-state message indicating there are no tasks yet |
| AC-010 | the empty-state message is showing | any visitor adds the first task | the empty-state message is replaced by the list containing that task |

### US-005: The list is shared globally across all visitors

**Priority:** high

> As a anonymous visitor, I want to work from one global list shared by everyone, so that any visitor can see and act on the same tasks.

| ID | Given | When | Then |
|---|---|---|---|
| AC-011 | a visitor adds a task | another visitor on a different session or device opens the app | they see the same shared list including that task |
| AC-012 | I am any anonymous visitor | I view the list | I can add, mark done, and delete any task on the list, because the list is global and not owned by any account |

## EPIC-003: Mark a task done and toggle it back

Delivered in sprint 2. A visitor can mark any task as done, shown struck through, and can toggle it back to not-done. Done tasks remain in the same list rather than being moved or hidden.

### US-006: Mark a task as done

**Priority:** high

> As a anonymous visitor, I want to mark a task as done, so that I can show that it has been completed.

| ID | Given | When | Then |
|---|---|---|---|
| AC-013 | a not-done task is on the list | I mark it as done | its status becomes done and it is displayed struck through while staying in the same position in the list |
| AC-014 | a task's status changes to done | another visitor views the shared list | they see the same task shown as done, because the change is saved on the shared list |

### US-007: Toggle a done task back to not-done

**Priority:** medium

> As a anonymous visitor, I want to change a done task back to not-done, so that I can correct a task I marked complete by mistake.

| ID | Given | When | Then |
|---|---|---|---|
| AC-015 | a task is marked done and shown struck through | I toggle it back to not-done | its status becomes not-done and it is no longer shown struck through, remaining in the same list (assumption: marking done is reversible) |

## EPIC-004: Delete a task with confirmation

Delivered in sprint 2. A visitor can delete any task from the shared list, but only after a confirmation step to avoid accidental removal.

### US-008: Delete a task after confirming

**Priority:** high

> As a anonymous visitor, I want to delete a task after a confirmation step, so that I can remove tasks that are no longer needed without deleting them by accident.

| ID | Given | When | Then |
|---|---|---|---|
| AC-016 | a task is on the list | I choose to delete it | I am asked to confirm before any deletion happens |
| AC-017 | I have been asked to confirm a deletion | I confirm | the task is permanently removed from the shared list and no longer appears for any visitor |
| AC-018 | I have been asked to confirm a deletion | I cancel | the task remains on the list unchanged |
| AC-019 | I delete the last remaining task | the deletion is confirmed | the list becomes empty and the empty-state message is shown |

## EPIC-005: Server-side persistence and anonymous, free access

Tasks are stored server-side in a database so the shared global list persists across sessions and devices. The app requires no sign-in and no accounts, and is free with no payments, billing, or subscriptions.

### US-009: Tasks persist across sessions and devices

**Priority:** high

> As a anonymous visitor, I want the shared list to be stored server-side, so that tasks remain available when I or anyone else returns later or uses another device.

| ID | Given | When | Then |
|---|---|---|---|
| AC-020 | tasks have been added to the shared list | I close the app and reopen it later in a new session | the same tasks are still present (assumption: tasks are stored server-side in a database) |
| AC-021 | tasks exist on the shared list | a visitor opens the app on a different device | they see the same persisted list |

### US-010: Use the app anonymously with no sign-in and no payment

**Priority:** high

> As a visitor, I want to use the app without creating an account, signing in, or paying, so that I can manage the shared list with no barriers.

| ID | Given | When | Then |
|---|---|---|---|
| AC-022 | I open the app for the first time | I want to add, mark done, or delete a task | I can do so immediately with no sign-in, no account, and no registration (accounts/sign-in are out of scope) |
| AC-023 | I use any feature of the app | I complete an action | I am never asked for payment, billing, or a subscription because the app is free (assumption: no payments or billing of any kind) |
<!-- sdlc:auto:end epics -->
