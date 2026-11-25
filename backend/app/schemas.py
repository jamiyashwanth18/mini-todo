"""Pydantic request and response models.

One pair per entity in the approved data model, plus the placeholder every
generated route returns until it has been implemented. Every model is an ApiModel,
so its JSON uses camelCase names (app/api_model.py).
"""

from datetime import datetime

from app.api_model import ApiModel


class StubResponse(ApiModel):
    """What a generated route returns until someone implements it.

    A stub that returns a typed body rather than raising keeps the service
    startable and its OpenAPI document complete, so the frontend can be built
    against the agreed shape while the handlers are still being written.
    """

    endpoint: str
    status: str = "not_implemented"
    detail: str = "Scaffolded from the approved API spec; no behaviour yet."


class UserCreate(ApiModel):
    email: str
    role: str


class UserRead(ApiModel):
    id: str
    email: str
    role: str


class TaskRead(ApiModel):
    """One task on the shared list: a title, a done/not-done status and when it was added."""

    id: str
    title: str
    done: bool
    created_at: datetime


class TaskUpdate(ApiModel):
    """What a change to an existing task may set: its done status, and nothing else.

    `done` is set either way round, so marking a task done and taking it back are the
    same call. A title cannot be edited once the task exists, so a title sent here is
    ignored, and nothing here moves the task in the list.
    """

    done: bool
