"""US-009: the shared list is stored server-side, so it survives sessions and devices.

Integration tests for test cases TC-009, TC-011, TC-013 and TC-016, written from the
story's acceptance criteria (AC-020, AC-021) and the reviewed test cases. A new session
or another device is a separate caller against the same shared database: `client` and
`auth_client` are different clients, and both must see the same persisted list.
"""

from typing import Any

from fastapi.testclient import TestClient


def _listed(client: TestClient) -> list[dict[str, Any]]:
    """GET /tasks, checked for status 200, and its body."""
    response = client.get("/tasks")

    assert response.status_code == 200, response.text
    return response.json()


def _find(tasks: list[dict[str, Any]], task_id: Any) -> dict[str, Any]:
    matches = [task for task in tasks if task["id"] == task_id]
    assert len(matches) == 1, tasks
    return matches[0]


def _titles(tasks: list[dict[str, Any]]) -> list[str]:
    return [task["title"] for task in tasks]


def test_tc009_created_task_is_returned_after_a_new_sessions_list_fetch(
    client: TestClient,
) -> None:
    assert _listed(client) == []

    created = client.post("/tasks", json={"title": "Buy milk"})

    assert created.status_code == 201, created.text
    task = created.json()
    assert task["title"] == "Buy milk"
    assert task["done"] is False

    # A later, independent fetch: a new session reading the same server-side list.
    tasks = _listed(client)

    assert tasks, tasks
    assert tasks[0]["id"] == task["id"], tasks
    assert tasks[0]["title"] == "Buy milk"
    assert tasks[0]["done"] is False


def test_tc011_deleted_task_stays_absent_on_a_later_sessions_fetch(
    client: TestClient,
) -> None:
    created = client.post("/tasks", json={"title": "Old note"})

    assert created.status_code == 201, created.text
    old_note_id = created.json()["id"]

    tasks = _listed(client)

    assert "Old note" in _titles(tasks), tasks
    task = _find(tasks, old_note_id)
    assert task["title"] == "Old note"

    deleted = client.delete(f"/tasks/{task['id']}")

    assert deleted.status_code in (200, 204), deleted.text

    tasks_after = _listed(client)

    assert task["id"] not in [listed["id"] for listed in tasks_after], tasks_after
    assert "Old note" not in _titles(tasks_after), tasks_after


def test_tc013_task_created_from_one_client_is_visible_to_another_clients_fetch(
    client: TestClient, auth_client: TestClient
) -> None:
    assert _listed(client) == []

    created = client.post("/tasks", json={"title": "Pick up parcel"})

    assert created.status_code == 201, created.text
    task = created.json()
    assert task["title"] == "Pick up parcel"

    # A separate client's request: another device reading the same shared list.
    tasks = _listed(auth_client)

    assert "Pick up parcel" in _titles(tasks), tasks
    listed_task = _find(tasks, task["id"])
    assert listed_task["title"] == "Pick up parcel"


def test_tc016_toggled_task_status_from_one_client_is_visible_to_another_clients_fetch(
    client: TestClient, auth_client: TestClient
) -> None:
    created = client.post("/tasks", json={"title": "Pay invoice"})

    assert created.status_code == 201, created.text
    invoice_id = created.json()["id"]

    tasks = _listed(client)

    task = _find(tasks, invoice_id)
    assert task["title"] == "Pay invoice"
    assert task["done"] is False

    patched = client.patch(f"/tasks/{task['id']}", json={"done": True})

    assert patched.status_code == 200, patched.text
    assert patched.json()["done"] is True

    # A separate client's request: another device reading the same shared list.
    tasks_after = _listed(auth_client)

    listed_task = _find(tasks_after, task["id"])
    assert listed_task["title"] == "Pay invoice"
    assert listed_task["done"] is True
