<!-- sdlc:auto:start adr -->
# ADR-0001: Use React 19 for Frontend

Status: Accepted  
Date: 2026-11-25

## Context and Problem Statement

Which Frontend technology does the project use? Decided in architecture v1.

## Considered Options

- React 19
- Vue
- Svelte

## Decision Outcome

Chosen option: React 19, because Approved stack. Renders the single live-updating list cleanly as tasks are added, toggled, and removed, and shows the empty-state when none remain. Built with Vite and served as static assets; reads the API base URL from VITE_API_BASE_URL.

## Consequences

More tooling than a hand-written page, but trivial for a one-screen app and matches the scaffold.
<!-- sdlc:auto:end adr -->