# Deployment Guide

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start how-it-deploys -->
Pushes to `main` run `.github/workflows/deploy.yml`, which builds the API image (if there is a backend) and deploys the SPA to AWS Amplify. Commits touching only `docs/sdlc/**` don't deploy. Deployments can also be started from the platform's Deployment tab.
<!-- sdlc:auto:end how-it-deploys -->

<!-- sdlc:auto:start environments -->
| Name | Service | Runtime | Scaling | Environment |
|---|---|---|---|---|
| SPA Host | React 19 static build on S3 + CloudFront | Static assets (Vite build) | CDN-served, no app scaling needed | dev |
| API Service | FastAPI 0.115 on AWS App Runner (or small ECS Fargate) | Python 3.12 + Uvicorn container | Single small instance, autoscale 1-2 for light traffic | dev |
| Database | Amazon RDS for PostgreSQL 16 | PostgreSQL 16, db.t4g.micro | Single instance, light load | dev |
<!-- sdlc:auto:end environments -->

<!-- sdlc:auto:start live -->
**Frontend URL:** https://p5ad00630047a.d3j61xaup4zgrx.amplifyapp.com

**Backend URL:** https://35-166-157-74.sslip.io/apps/5ad00630047a/

**Database:** PostgreSQL · app

**Version:** 1d6b051eb887

**Commit:** `1d6b051`

**Finished:** 2026-11-25
<!-- sdlc:auto:end live -->

<!-- sdlc:auto:start topology -->
```mermaid
graph LR
  n_SPA_Host["SPA Host<br/>React 19 static build on S3 + CloudFront"]
  n_API_Service["API Service<br/>FastAPI 0.115 on AWS App Runner (or small ECS Fargate)"]
  n_Database["Database<br/>Amazon RDS for PostgreSQL 16"]
  n_SPA_Host -->|"HTTPS"| n_API_Service
  n_API_Service -->|"TCP/TLS (PostgreSQL)"| n_Database
```
<!-- sdlc:auto:end topology -->
