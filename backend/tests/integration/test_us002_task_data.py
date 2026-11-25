"""US-002: a task holds only a title, a done/not-done status and a creation timestamp.

Integration tests for test cases TC-023, TC-025 and TC-026, written from the story's
acceptance criteria (AC-005, AC-006) and the reviewed test cases.
"""

from typing import Any

from fastapi.testclient import TestClient

# The only data a task may carry, besides the identifier the API needs to address it.
ALLOWED_FIELDS = {"id", "title", "done", "createdAt"}
REQUIRED_FIELDS = {"title", "done", "createdAt"}
FORBIDDEN_FIELDS = ("dueDate", "priority", "category", "description")


def _assert_only_allowed_fields(task: dict[str, Any]) -> None:
    """The task carries title, status and creation timestamp, and nothing beyond them."""
    assert REQUIRED_FIELDS <= set(task), task
    assert set(task) <= ALLOWED_FIELDS, task
    for field in FORBIDDEN_FIELDS:
        assert field not in task, task


def _find(tasks: list[dict[str, Any]], task_id: Any) -> dict[str, Any]:
    matches = [task for task in tasks if task["id"] == task_id]
    assert len(matches) == 1, tasks
    return matches[0]


def test_tc023_created_task_stores_only_title_status_and_creation_time(
    client: TestClient,
) -> None:
    created = client.post("/tasks", json={"title": "Buy milk"})

    assert created.status_code == 201, created.text
    task = created.json()
    assert task["title"] == "Buy milk"
    assert task["done"] is False
    assert task["createdAt"]
    _assert_only_allowed_fields(task)

    listed = client.get("/tasks")

    assert listed.status_code == 200, listed.text
    listed_task = _find(listed.json(), task["id"])
    assert listed_task["title"] == "Buy milk"
    assert listed_task["done"] is False
    assert listed_task["createdAt"]
    _assert_only_allowed_fields(listed_task)


def test_tc025_extra_fields_sent_on_creation_are_not_stored(client: TestClient) -> None:
    created = client.post(
        "/tasks",
        json={
            "title": "Call dentist",
            "dueDate": "2026-12-01",
            "priority": "High",
            "category": "Health",
            "description": "Checkup",
        },
    )

    assert created.status_code == 201, created.text
    task = created.json()
    assert task["title"] == "Call dentist"
    assert task["done"] is False
    assert task["createdAt"]
    _assert_only_allowed_fields(task)

    listed = client.get("/tasks")

    assert listed.status_code == 200, listed.text
    listed_task = _find(listed.json(), task["id"])
    assert listed_task["title"] == "Call dentist"
    _assert_only_allowed_fields(listed_task)


def test_tc026_patch_cannot_change_a_tasks_title(client: TestClient) -> None:
    created = client.post("/tasks", json={"title": "Original title"})

    assert created.status_code == 201, created.text
    task = created.json()
    assert task["title"] == "Original title"
    assert task["done"] is False

    patched = client.patch(f"/tasks/{task['id']}", json={"title": "Changed title", "done": True})

    assert patched.status_code == 200, patched.text
    assert patched.json()["done"] is True

    listed = client.get("/tasks")

    assert listed.status_code == 200, listed.text
    listed_task = _find(listed.json(), task["id"])
    assert listed_task["title"] == "Original title"
    assert listed_task["done"] is True
