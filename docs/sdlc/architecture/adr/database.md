<!-- sdlc:auto:start adr -->
# ADR-0003: Use PostgreSQL 16 for Database

Status: Accepted  
Date: 2026-11-25

## Context and Problem Statement

Which Database technology does the project use? Decided in architecture v1.

## Considered Options

- PostgreSQL 16
- SQLite
- DynamoDB

## Decision Outcome

Chosen option: PostgreSQL 16, because Approved stack. A single tasks table persists the shared list server-side across sessions and devices and sorts newest-first by created_at with no effort.

## Consequences

Heavier than SQLite for one table, but gives reliable shared persistence and is the platform default.
<!-- sdlc:auto:end adr -->