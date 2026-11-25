"""The shared task list: the endpoints of the tasks entity."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Task
from app.schemas import TaskRead

router = APIRouter(tags=["Tasks"])


@router.get("/tasks", response_model=list[TaskRead])
def list_tasks(session: Annotated[Session, Depends(get_db)]) -> list[Task]:
    """Every task on the shared list, newest-first by creation time; empty when none exist.

    One list for everybody: done and not-done tasks alike, each in its place in that
    order, none hidden. `id` breaks a tie between two tasks added in the same instant so
    the order never changes between two reads.
    """
    order = (Task.created_at.desc(), Task.id.desc())
    return list(session.scalars(select(Task).order_by(*order)).all())
