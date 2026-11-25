"""US-003: GET /tasks returns the shared list newest-first (AC-007, AC-008)."""

from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Task

_NOW = datetime(2026, 11, 25, 12, 0, tzinfo=UTC)


def _add_task(session: Session, title: str, minutes_ago: int, done: bool = False) -> Task:
    task = Task(
        id=str(uuid4()),
        title=title,
        done=done,
        created_at=_NOW - timedelta(minutes=minutes_ago),
    )
    session.add(task)
    session.flush()
    return task


def test_ac007_lists_every_task_newest_first(client: TestClient, db_session: Session) -> None:
    _add_task(db_session, "Oldest", minutes_ago=30)
    _add_task(db_session, "Newest", minutes_ago=1)
    _add_task(db_session, "Middle", minutes_ago=10)

    response = client.get("/tasks")

    assert response.status_code == 200, response.text
    assert [task["title"] for task in response.json()] == ["Newest", "Middle", "Oldest"]


def test_ac007_returns_an_empty_list_when_no_task_exists(client: TestClient) -> None:
    response = client.get("/tasks")

    assert response.status_code == 200, response.text
    assert response.json() == []


def test_ac007_each_task_carries_its_id_title_status_and_creation_time(
    client: TestClient, db_session: Session
) -> None:
    created = _add_task(db_session, "Buy milk", minutes_ago=5)

    response = client.get("/tasks")

    assert response.status_code == 200, response.text
    [task] = response.json()
    assert task == {
        "id": created.id,
        "title": "Buy milk",
        "done": False,
        "createdAt": task["createdAt"],
    }
    assert datetime.fromisoformat(task["createdAt"]) == created.created_at


def test_ac008_done_tasks_stay_in_place_in_the_same_list(
    client: TestClient, db_session: Session
) -> None:
    _add_task(db_session, "Oldest done", minutes_ago=30, done=True)
    _add_task(db_session, "Newest not done", minutes_ago=1)
    _add_task(db_session, "Middle done", minutes_ago=10, done=True)

    response = client.get("/tasks")

    assert response.status_code == 200, response.text
    tasks = response.json()
    assert [task["title"] for task in tasks] == [
        "Newest not done",
        "Middle done",
        "Oldest done",
    ]
    assert [task["done"] for task in tasks] == [False, True, True]
