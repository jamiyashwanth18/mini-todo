<!-- sdlc:auto:start adr -->
# ADR-0004: Use AWS for Cloud

Status: Accepted  
Date: 2026-11-25

## Context and Problem Statement

Which Cloud technology does the project use? Decided in architecture v1.

## Considered Options

- AWS
- GCP
- Azure

## Decision Outcome

Chosen option: AWS, because Approved stack. Hosts the small API (App Runner) and the shared database (RDS PostgreSQL 16) plus the static SPA (S3/CloudFront) in a small, inexpensive setup that keeps the list reachable (NFR-002).

## Consequences

More services to wire than a single PaaS, but each piece is small and the platform default.
<!-- sdlc:auto:end adr -->