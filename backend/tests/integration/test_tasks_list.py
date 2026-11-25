"""US-003: all tasks in one list, newest-first, done tasks left in place.

Integration tests for test cases TC-001, TC-003, TC-005 and TC-008, written from the
story's acceptance criteria (AC-007, AC-008) and the reviewed test cases.
"""

from typing import Any

from fastapi.testclient import TestClient


def _create(client: TestClient, title: str) -> dict[str, Any]:
    """Create a task and check it starts out not-done, as every case's steps expect."""
    response = client.post("/tasks", json={"title": title})

    assert response.status_code == 201, response.text
    task = response.json()
    assert task["title"] == title
    assert task["done"] is False
    return task


def _set_done(client: TestClient, task_id: Any, done: bool) -> dict[str, Any]:
    response = client.patch(f"/tasks/{task_id}", json={"done": done})

    assert response.status_code == 200, response.text
    task = response.json()
    assert task["done"] is done
    return task


def _listed(client: TestClient) -> list[dict[str, Any]]:
    response = client.get("/tasks")

    assert response.status_code == 200, response.text
    return response.json()


def test_tc001_tasks_are_returned_newest_first_after_creation(client: TestClient) -> None:
    assert _listed(client) == []

    _create(client, "Write report")
    _create(client, "Buy groceries")
    _create(client, "Call plumber")

    tasks = _listed(client)

    assert [task["title"] for task in tasks] == [
        "Call plumber",
        "Buy groceries",
        "Write report",
    ]


def test_tc003_empty_list_returns_an_empty_array(client: TestClient) -> None:
    response = client.get("/tasks")

    assert response.status_code == 200, response.text
    assert response.json() == []


def test_tc005_marking_a_task_done_does_not_change_its_position(client: TestClient) -> None:
    assert _listed(client) == []

    _create(client, "Task A")
    task_b = _create(client, "Task B")
    _create(client, "Task C")

    _set_done(client, task_b["id"], True)

    tasks = _listed(client)

    assert [task["title"] for task in tasks] == ["Task C", "Task B", "Task A"]
    done_by_title = {task["title"]: task["done"] for task in tasks}
    assert done_by_title["Task B"] is True
    assert done_by_title["Task A"] is False
    assert done_by_title["Task C"] is False


def test_tc008_toggling_done_back_to_false_preserves_order(client: TestClient) -> None:
    assert _listed(client) == []

    draft_notes = _create(client, "Draft notes")
    _create(client, "Email team")

    _set_done(client, draft_notes["id"], True)
    _set_done(client, draft_notes["id"], False)

    tasks = _listed(client)

    assert [task["title"] for task in tasks] == ["Email team", "Draft notes"]
    done_by_title = {task["title"]: task["done"] for task in tasks}
    assert done_by_title["Draft notes"] is False
    assert done_by_title["Email team"] is False
