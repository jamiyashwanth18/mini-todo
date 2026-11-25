"""US-006: mark a task as done, on the one shared list.

Integration tests for test cases TC-059, TC-060 and TC-063, written from the story's
acceptance criteria (AC-013, AC-014) and the reviewed test cases. PATCH /tasks/{id} sets
the done status and nothing else, so the task keeps its place in the newest-first list;
a later GET, standing for another visitor, reads the change back from the shared list.
"""

from typing import Any

from fastapi.testclient import TestClient

# An id no task on the shared list carries, as case TC-060 gives it.
MISSING_ID = "nonexistent-id-999"


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


def test_tc059_marking_a_task_done_updates_status_and_keeps_position(
    client: TestClient,
) -> None:
    buy_milk = _created(client, "Buy milk")
    walk_dog = _created(client, "Walk dog")

    before = _listed(client)
    walk_dog_before = _position(before, walk_dog["id"])
    buy_milk_before = _position(before, buy_milk["id"])

    assert walk_dog_before >= 0, before
    assert buy_milk_before == walk_dog_before + 1, before

    patched = client.patch(f"/tasks/{buy_milk['id']}", json={"done": True})

    assert patched.status_code == 200, patched.text
    assert patched.json()["id"] == buy_milk["id"]
    assert patched.json()["title"] == "Buy milk"
    assert patched.json()["done"] is True

    after = _listed(client)

    assert _position(after, walk_dog["id"]) == walk_dog_before, after
    assert _position(after, buy_milk["id"]) == buy_milk_before, after
    assert _entry(after, buy_milk["id"])["done"] is True
    assert _entry(after, buy_milk["id"])["title"] == "Buy milk"
    assert _entry(after, walk_dog["id"])["done"] is False


def test_tc060_marking_a_non_existent_task_done_fails(client: TestClient) -> None:
    before = _listed(client)

    response = client.patch(f"/tasks/{MISSING_ID}", json={"done": True})

    assert response.status_code == 404, response.text

    assert _listed(client) == before


def test_tc063_a_task_marked_done_is_visible_in_a_later_get_call(
    client: TestClient, auth_client: TestClient
) -> None:
    clean_house = _created(client, "Clean house")

    patched = client.patch(f"/tasks/{clean_house['id']}", json={"done": True})

    assert patched.status_code == 200, patched.text
    assert patched.json()["id"] == clean_house["id"]
    assert patched.json()["title"] == "Clean house"
    assert patched.json()["done"] is True

    tasks = _listed(auth_client)
    listed = _entry(tasks, clean_house["id"])

    assert listed["title"] == "Clean house"
    assert listed["done"] is True
