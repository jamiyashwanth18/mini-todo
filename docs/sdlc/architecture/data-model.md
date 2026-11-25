# Data Model

<!-- sdlc:auto:start entities -->
### tasks

| Field | Type | PK | FK | Nullable |
|---|---|---|---|---|
| id | uuid | True | — | False |
| title | varchar(100) | False | — | False |
| done | boolean | False | — | False |
| created_at | timestamptz | False | — | False |
<!-- sdlc:auto:end entities -->

<!-- sdlc:auto:start relationships -->
_No relationships recorded._
<!-- sdlc:auto:end relationships -->

<!-- sdlc:auto:start er-diagram -->
```mermaid
erDiagram
  tasks {
    uuid id PK
    varchar_100_ title
    boolean done
    timestamptz created_at
  }
```
<!-- sdlc:auto:end er-diagram -->
