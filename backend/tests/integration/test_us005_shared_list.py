"""US-005: one global list, shared by every anonymous visitor, owned by nobody.

Integration tests for test cases TC-028, TC-030, TC-032, TC-034, TC-036 and TC-037,
written from the story's acceptance criteria (AC-011, AC-012) and the reviewed test
cases. A second caller is a second client on the same shared database: `auth_client` is
a different session from `client`, and the shared list must answer both the same way,
with no ownership of any task.
"""

from typing import Any

from fastapi.testclient import TestClient

# An id no task on the shared list carries, as the cases give it.
MISSING_ID = "nonexistent-id-999"


def _listed(client: TestClient) -> list[dict[str, Any]]:
    """GET /tasks, checked for status 200, and its body."""
    response = client.get("/tasks")

    assert response.status_code == 200, response.text
    return response.json()


def _titles(tasks: list[dict[str, Any]]) -> list[str]:
    return [task["title"] for task in tasks]


def test_tc028_task_created_by_one_caller_is_visible_to_another(
    client: TestClient, auth_client: TestClient
) -> None:
    created = client.post("/tasks", json={"title": "Buy milk"})

    assert created.status_code == 201, created.text
    task = created.json()
    assert task["title"] == "Buy milk"
    assert task["done"] is False
    assert task["createdAt"]

    tasks = _listed(auth_client)

    assert tasks, tasks
    assert tasks[0]["id"] == task["id"]
    assert tasks[0]["title"] == "Buy milk"
    assert tasks[0]["done"] is False
    assert tasks[0]["createdAt"]


def test_tc030_any_caller_can_mark_done_and_delete_a_task_they_did_not_create(
    client: TestClient, auth_client: TestClient
) -> None:
    created = client.post("/tasks", json={"title": "Water plants"})

    assert created.status_code == 201, created.text
    task = created.json()
    assert task["done"] is False
    assert task["id"]

    patched = auth_client.patch(f"/tasks/{task['id']}", json={"done": True})

    assert patched.status_code == 200, patched.text
    assert patched.json()["done"] is True

    deleted = auth_client.delete(f"/tasks/{task['id']}")

    assert deleted.status_code in (200, 204), deleted.text

    tasks = _listed(client)

    assert task["id"] not in [listed["id"] for listed in tasks], tasks
    assert "Water plants" not in _titles(tasks), tasks


def test_tc032_adding_a_task_with_an_empty_title_is_rejected(client: TestClient) -> None:
    before = _listed(client)

    response = client.post("/tasks", json={"title": ""})

    assert response.status_code == 400, response.text
    assert "title" in response.text.lower()

    assert _listed(client) == before


def test_tc034_adding_a_task_with_a_title_over_100_characters_is_rejected(
    client: TestClient,
) -> None:
    before = _listed(client)

    response = client.post("/tasks", json={"title": "A" * 101})

    assert response.status_code == 400, response.text
    assert "100" in response.text
    assert "title" in response.text.lower()

    assert _listed(client) == before


def test_tc036_marking_a_non_existent_task_done_fails_cleanly(client: TestClient) -> None:
    before = _listed(client)

    response = client.patch(f"/tasks/{MISSING_ID}", json={"done": True})

    assert response.status_code == 404, response.text

    assert _listed(client) == before


def test_tc037_deleting_a_non_existent_task_fails_cleanly(client: TestClient) -> None:
    before = _listed(client)

    response = client.delete(f"/tasks/{MISSING_ID}")

    assert response.status_code == 404, response.text

    assert _listed(client) == before
