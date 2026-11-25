"""The shared task list: GET /tasks newest-first (AC-007, AC-008) and PATCH /tasks/{id}
setting a task's done status in place, on the one shared list (AC-013, AC-014), either
way round so marking done can be taken back (AC-015), and DELETE /tasks/{id} removing a
task for good once the SPA has confirmed (AC-017), down to an empty list (AC-019)."""

from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
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


def test_ac013_marking_a_task_done_sets_its_status(client: TestClient, db_session: Session) -> None:
    task = _add_task(db_session, "Buy milk", minutes_ago=5)

    response = client.patch(f"/tasks/{task.id}", json={"done": True})

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["id"] == task.id
    assert body["done"] is True


def test_ac013_a_task_marked_done_keeps_its_position_in_the_list(
    client: TestClient, db_session: Session
) -> None:
    _add_task(db_session, "Oldest", minutes_ago=30)
    _add_task(db_session, "Newest", minutes_ago=1)
    middle = _add_task(db_session, "Middle", minutes_ago=10)

    assert client.patch(f"/tasks/{middle.id}", json={"done": True}).status_code == 200

    tasks = client.get("/tasks").json()
    assert [task["title"] for task in tasks] == ["Newest", "Middle", "Oldest"]
    assert [task["done"] for task in tasks] == [False, True, False]


def test_ac013_only_the_status_changes_not_the_title_or_creation_time(
    client: TestClient, db_session: Session
) -> None:
    task = _add_task(db_session, "Buy milk", minutes_ago=5)
    created_at = task.created_at

    body = client.patch(f"/tasks/{task.id}", json={"done": True}).json()

    assert body["title"] == "Buy milk"
    assert datetime.fromisoformat(body["createdAt"]) == created_at


def test_ac013_marking_a_done_task_not_done_takes_it_back(
    client: TestClient, db_session: Session
) -> None:
    task = _add_task(db_session, "Buy milk", minutes_ago=5, done=True)

    response = client.patch(f"/tasks/{task.id}", json={"done": False})

    assert response.status_code == 200, response.text
    assert response.json()["done"] is False
    assert [item["done"] for item in client.get("/tasks").json()] == [False]


def test_ac013_a_body_without_a_done_status_is_refused(
    client: TestClient, db_session: Session
) -> None:
    task = _add_task(db_session, "Buy milk", minutes_ago=5)

    response = client.patch(f"/tasks/{task.id}", json={})

    assert response.status_code == 400, response.text
    assert client.get("/tasks").json()[0]["done"] is False


def test_ac013_marking_an_unknown_task_done_is_refused(client: TestClient) -> None:
    response = client.patch(f"/tasks/{uuid4()}", json={"done": True})

    assert response.status_code == 404, response.text


def test_ac015_toggling_a_done_task_back_makes_its_status_not_done(
    client: TestClient, db_session: Session
) -> None:
    task = _add_task(db_session, "Buy milk", minutes_ago=5, done=True)

    response = client.patch(f"/tasks/{task.id}", json={"done": False})

    assert response.status_code == 200, response.text
    assert response.json()["done"] is False
    assert client.get("/tasks").json()[0]["done"] is False


def test_ac015_a_task_toggled_back_stays_in_place_in_the_same_list(
    client: TestClient, db_session: Session
) -> None:
    _add_task(db_session, "Oldest", minutes_ago=30)
    _add_task(db_session, "Newest", minutes_ago=1)
    middle = _add_task(db_session, "Middle", minutes_ago=10, done=True)

    assert client.patch(f"/tasks/{middle.id}", json={"done": False}).status_code == 200

    tasks = client.get("/tasks").json()
    assert [task["title"] for task in tasks] == ["Newest", "Middle", "Oldest"]
    assert [task["done"] for task in tasks] == [False, False, False]


def test_ac015_toggling_back_changes_only_the_status(
    client: TestClient, db_session: Session
) -> None:
    task = _add_task(db_session, "Buy milk", minutes_ago=5, done=True)
    created_at = task.created_at

    body = client.patch(f"/tasks/{task.id}", json={"done": False}).json()

    assert body["id"] == task.id
    assert body["title"] == "Buy milk"
    assert datetime.fromisoformat(body["createdAt"]) == created_at


def test_ac015_marking_done_is_reversible_as_often_as_a_visitor_likes(
    client: TestClient, db_session: Session
) -> None:
    task = _add_task(db_session, "Buy milk", minutes_ago=5)

    statuses = [
        client.patch(f"/tasks/{task.id}", json={"done": wanted}).json()["done"]
        for wanted in (True, False, True, False)
    ]

    assert statuses == [True, False, True, False]
    assert client.get("/tasks").json()[0]["done"] is False


def test_ac015_toggling_back_an_unknown_task_is_refused(client: TestClient) -> None:
    response = client.patch(f"/tasks/{uuid4()}", json={"done": False})

    assert response.status_code == 404, response.text


def test_ac015_a_toggle_back_without_a_done_status_is_refused(
    client: TestClient, db_session: Session
) -> None:
    task = _add_task(db_session, "Buy milk", minutes_ago=5, done=True)

    response = client.patch(f"/tasks/{task.id}", json={})

    assert response.status_code == 400, response.text
    assert client.get("/tasks").json()[0]["done"] is True


def test_ac017_a_confirmed_delete_removes_the_task(client: TestClient, db_session: Session) -> None:
    task = _add_task(db_session, "Buy milk", minutes_ago=5)

    response = client.delete(f"/tasks/{task.id}")

    assert response.status_code == 204, response.text
    assert response.content == b""
    assert client.get("/tasks").json() == []


def test_ac017_a_deleted_task_is_gone_for_good_on_a_later_read(
    client: TestClient, db_session: Session
) -> None:
    task = _add_task(db_session, "Buy milk", minutes_ago=5)

    assert client.delete(f"/tasks/{task.id}").status_code == 204
    assert db_session.get(Task, task.id) is None
    assert client.get("/tasks").json() == []
    assert client.delete(f"/tasks/{task.id}").status_code == 404


def test_ac017_a_deleted_task_no_longer_appears_for_any_visitor(
    client: TestClient, db_session: Session
) -> None:
    task = _add_task(db_session, "Buy milk", minutes_ago=5)
    kept = _add_task(db_session, "Walk the dog", minutes_ago=1)
    db_session.commit()

    assert client.delete(f"/tasks/{task.id}").status_code == 204

    another_visitor = TestClient(app)
    assert [item["id"] for item in another_visitor.get("/tasks").json()] == [kept.id]


def test_ac017_only_the_chosen_task_is_deleted(client: TestClient, db_session: Session) -> None:
    _add_task(db_session, "Oldest", minutes_ago=30)
    middle = _add_task(db_session, "Middle", minutes_ago=10, done=True)
    _add_task(db_session, "Newest", minutes_ago=1)

    assert client.delete(f"/tasks/{middle.id}").status_code == 204

    tasks = client.get("/tasks").json()
    assert [task["title"] for task in tasks] == ["Newest", "Oldest"]
    assert [task["done"] for task in tasks] == [False, False]


def test_ac017_deleting_an_unknown_task_is_refused(client: TestClient, db_session: Session) -> None:
    kept = _add_task(db_session, "Buy milk", minutes_ago=5)

    response = client.delete(f"/tasks/{uuid4()}")

    assert response.status_code == 404, response.text
    assert [item["id"] for item in client.get("/tasks").json()] == [kept.id]


def test_ac019_deleting_the_last_remaining_task_empties_the_list(
    client: TestClient, db_session: Session
) -> None:
    first = _add_task(db_session, "Buy milk", minutes_ago=5)
    second = _add_task(db_session, "Walk the dog", minutes_ago=1)

    assert client.delete(f"/tasks/{second.id}").status_code == 204
    assert [item["id"] for item in client.get("/tasks").json()] == [first.id]

    assert client.delete(f"/tasks/{first.id}").status_code == 204
    assert client.get("/tasks").json() == []


def test_ac019_a_task_added_after_the_list_was_emptied_is_the_only_one_left(
    client: TestClient, db_session: Session
) -> None:
    task = _add_task(db_session, "Buy milk", minutes_ago=5)
    assert client.delete(f"/tasks/{task.id}").status_code == 204

    created = client.post("/tasks", json={"title": "Walk the dog"})

    assert created.status_code == 201, created.text
    assert [item["title"] for item in client.get("/tasks").json()] == ["Walk the dog"]


def test_ac014_the_new_status_is_saved_on_the_shared_list_for_every_visitor(
    client: TestClient, db_session: Session
) -> None:
    task = _add_task(db_session, "Buy milk", minutes_ago=5)
    db_session.commit()

    assert client.patch(f"/tasks/{task.id}", json={"done": True}).status_code == 200

    another_visitor = TestClient(app)
    tasks = another_visitor.get("/tasks").json()
    assert tasks == [
        {
            "id": task.id,
            "title": "Buy milk",
            "done": True,
            "createdAt": tasks[0]["createdAt"],
        }
    ]
