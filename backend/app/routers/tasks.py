"""The shared task list: the endpoints of the tasks entity.

One list for everybody, owned by nobody: anyone may add a task, set its done status and
delete it, with no sign-in. The request models live here beside the routes that read them
(app/auth.py does the same with its own), so the one rule a title must follow is written
once, in Pydantic, and every request body is checked against it before a handler runs.
"""

from collections.abc import Awaitable, Callable
from datetime import UTC, datetime
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Path, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.routing import APIRoute
from pydantic import field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api_model import ApiModel
from app.database import get_db
from app.errors import TASK_NOT_FOUND, UNUSABLE_TASK_BODY
from app.models import Task
from app.schemas import TaskRead, TaskUpdate

# A title is required and, once trimmed, may be no longer than this.
MAX_TITLE_LENGTH = 100


class TaskCreate(ApiModel):
    """The only thing a new task carries: a title, trimmed, 1-100 characters.

    Anything else sent along (a due date, a priority, a category, a description) is not
    part of a task and is ignored rather than stored.
    """

    title: str

    @field_validator("title")
    @classmethod
    def _trimmed_title(cls, value: str) -> str:
        title = value.strip()
        if not title:
            raise ValueError("A title is required.")
        if len(title) > MAX_TITLE_LENGTH:
            raise ValueError(f"Title must be at most {MAX_TITLE_LENGTH} characters.")
        return title


def _bad_request(invalid: RequestValidationError) -> HTTPException:
    """The first broken rule, as a 400 a caller can act on."""
    errors = invalid.errors()
    if not errors:
        return UNUSABLE_TASK_BODY.http("The request body is not usable.")
    first = errors[0]
    # loc is ("body", "title"); the first part only says where the value came from.
    field = ".".join(str(part) for part in first.get("loc", ())[1:]) or "body"
    message = str(first.get("msg", "is not usable")).removeprefix("Value error, ")
    return UNUSABLE_TASK_BODY.http(f"{field}: {message}")


class _BadRequestOnUnusableBody(APIRoute):
    """Answers a body that breaks a rule of its model with 400 and the rule it broke.

    FastAPI's own answer is 422 with a list of validation errors; these endpoints promise
    a plain 400 naming the field, so the rule stays in the Pydantic model and only the
    shape of the refusal is translated here.
    """

    def get_route_handler(self) -> Callable[[Request], Awaitable[Response]]:
        handle = super().get_route_handler()

        async def handler(request: Request) -> Response:
            try:
                return await handle(request)
            except RequestValidationError as invalid:
                raise _bad_request(invalid) from invalid

        return handler


router = APIRouter(tags=["Tasks"], route_class=_BadRequestOnUnusableBody)

UNUSABLE_BODY = UNUSABLE_TASK_BODY.response
NO_SUCH_TASK = TASK_NOT_FOUND.response

TaskId = Annotated[str, Path(alias="id", description="The id of the task on the shared list.")]
DbSession = Annotated[Session, Depends(get_db)]


def _task_or_404(session: Session, task_id: str) -> Task:
    task = session.get(Task, task_id)
    if task is None:
        raise TASK_NOT_FOUND.http()
    return task


@router.get("/tasks", response_model=list[TaskRead])
def list_tasks(session: DbSession) -> list[Task]:
    """Every task on the shared list, newest-first by creation time; empty when none exist.

    One list for everybody: done and not-done tasks alike, each in its place in that
    order, none hidden. `id` breaks a tie between two tasks added in the same instant so
    the order never changes between two reads.
    """
    order = (Task.created_at.desc(), Task.id.desc())
    return list(session.scalars(select(Task).order_by(*order)).all())


@router.post(
    "/tasks",
    response_model=TaskRead,
    status_code=status.HTTP_201_CREATED,
    responses={status.HTTP_400_BAD_REQUEST: UNUSABLE_BODY},
)
def create_task(body: TaskCreate, session: DbSession) -> Task:
    """Add a task to the shared list: a title, not-done, stamped with the moment it arrived.

    It becomes the newest task, so the list returns it first until another is added.
    """
    task = Task(id=str(uuid4()), title=body.title, done=False, created_at=datetime.now(UTC))
    session.add(task)
    session.commit()
    return task


@router.patch(
    "/tasks/{id}",
    response_model=TaskRead,
    responses={
        status.HTTP_400_BAD_REQUEST: UNUSABLE_BODY,
        status.HTTP_404_NOT_FOUND: NO_SUCH_TASK,
    },
)
def set_task_done(task_id: TaskId, body: TaskUpdate, session: DbSession) -> Task:
    """Set a task's done status, either way round.

    Only the status changes: the task keeps its title and its creation time, so it stays
    exactly where it was in the newest-first list.
    """
    task = _task_or_404(session, task_id)
    task.done = body.done
    session.commit()
    return task


@router.delete(
    "/tasks/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={status.HTTP_404_NOT_FOUND: NO_SUCH_TASK},
)
def delete_task(task_id: TaskId, session: DbSession) -> None:
    """Remove a task from the shared list for good; the SPA confirms before calling this."""
    session.delete(_task_or_404(session, task_id))
    session.commit()
