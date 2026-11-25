<!-- sdlc:auto:start adr -->
# ADR-0002: Use FastAPI 0.115 for Backend

Status: Accepted  
Date: 2026-11-25

## Context and Problem Statement

Which Backend technology does the project use? Decided in architecture v1.

## Considered Options

- FastAPI 0.115
- Flask
- Express

## Decision Outcome

Chosen option: FastAPI 0.115, because Approved stack. Four small endpoints with the 1-100 character title rule enforced once via Pydantic validation, fitting the two-sprint plan.

## Consequences

A full framework for a tiny API, but it is the platform default and keeps validation and docs effortless.
<!-- sdlc:auto:end adr -->