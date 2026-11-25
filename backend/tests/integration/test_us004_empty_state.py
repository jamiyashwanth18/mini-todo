"""US-004: an empty-state message when the shared list holds no tasks.

Integration tests for test cases TC-039, TC-041 and TC-044, written from the story's
acceptance criteria (AC-009, AC-010) and the reviewed test cases. The API side of the
empty state is what these tests prove: GET /tasks reports an empty list while no task
exists, and reports the first task as soon as one is added.
"""

from typing import Any

from fastapi.testclient import TestClient


def _listed(client: TestClient) -> list[dict[str, Any]]:
    """GET /tasks, checked for status 200, and its body."""
    response = client.get("/tasks")

    assert response.status_code == 200, response.text
    return response.json()


def test_tc039_empty_list_returns_an_empty_array(client: TestClient) -> None:
    response = client.get("/tasks")

    assert response.status_code == 200, response.text
    assert response.json() == []


def test_tc041_adding_the_first_task_makes_the_list_non_empty(client: TestClient) -> None:
    assert _listed(client) == []

    created = client.post("/tasks", json={"title": "Buy milk"})

    assert created.status_code == 201, created.text
    task = created.json()
    assert task["title"] == "Buy milk"
    assert task["done"] is False

    tasks = _listed(client)

    assert len(tasks) == 1, tasks
    assert tasks[0]["id"] == task["id"]
    assert tasks[0]["title"] == "Buy milk"
    assert tasks[0]["done"] is False


def test_tc044_posting_a_blank_title_does_not_create_a_task(client: TestClient) -> None:
    assert _listed(client) == []

    response = client.post("/tasks", json={"title": ""})

    assert response.status_code == 400, response.text
    assert "title" in response.text.lower()

    assert _listed(client) == []
