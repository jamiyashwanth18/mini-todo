"""US-007: toggle a done task back to not-done, on the one shared list.

Integration tests for test cases TC-056 and TC-057, written from the story's acceptance
criterion AC-015 and the reviewed test cases. PATCH /tasks/{id} sets the done status
either way round, so taking a task back to not-done is the same call as marking it done;
only the status changes, so the task keeps its creation time and its place in the
newest-first list. An id no task carries is answered with a not-found error and leaves
the shared list untouched.
"""

from typing import Any

from fastapi.testclient import TestClient

# An id no task on the shared list carries, as case TC-057 gives it.
MISSING_ID = "non-existent-id-99999"


def _listed(client: TestClient) -> list[dict[str, Any]]:
    """GET /tasks, checked for status 200, and its body."""
    response = client.get("/tasks")

    assert response.status_code == 200, response.text
    return response.json()


def _created(client: TestClient, title: str) -> dict[str, Any]:
    """POST /tasks, checked for a 201 holding a new not-done task with that title."""
    response = client.post("/tasks", json={"title": title})

    assert response.status_code == 201, response.text
    task = response.json()
    assert task["title"] == title
    assert task["done"] is False
    assert task["id"]
    return task


def _position(tasks: list[dict[str, Any]], task_id: str) -> int:
    """Where a task sits in the listed order; -1 when it is not listed at all."""
    for index, listed in enumerate(tasks):
        if listed["id"] == task_id:
            return index
    return -1


def _entry(tasks: list[dict[str, Any]], task_id: str) -> dict[str, Any]:
    """The listed task with this id."""
    matching = [listed for listed in tasks if listed["id"] == task_id]

    assert len(matching) == 1, tasks
    return matching[0]


def test_tc056_a_done_task_is_toggled_back_to_not_done_in_place(client: TestClient) -> None:
    buy_groceries = _created(client, "Buy groceries")

    before = _listed(client)
    position_before = _position(before, buy_groceries["id"])

    assert position_before >= 0, before
    assert _entry(before, buy_groceries["id"])["done"] is False

    marked_done = client.patch(f"/tasks/{buy_groceries['id']}", json={"done": True})

    assert marked_done.status_code == 200, marked_done.text
    assert marked_done.json()["id"] == buy_groceries["id"]
    assert marked_done.json()["done"] is True

    taken_back = client.patch(f"/tasks/{buy_groceries['id']}", json={"done": False})

    assert taken_back.status_code == 200, taken_back.text
    assert taken_back.json()["id"] == buy_groceries["id"]
    assert taken_back.json()["title"] == "Buy groceries"
    assert taken_back.json()["done"] is False

    after = _listed(client)
    listed = _entry(after, buy_groceries["id"])

    assert listed["title"] == "Buy groceries"
    assert listed["done"] is False
    assert listed["createdAt"] == buy_groceries["createdAt"]
    assert _position(after, buy_groceries["id"]) == position_before, after


def test_tc057_toggling_a_task_that_does_not_exist_fails(client: TestClient) -> None:
    before = _listed(client)

    response = client.patch(f"/tasks/{MISSING_ID}", json={"done": False})

    assert response.status_code == 404, response.text

    after = _listed(client)

    assert after == before
    assert _position(after, MISSING_ID) == -1, after
