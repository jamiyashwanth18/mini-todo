"""US-008: delete a task after confirming.

Integration tests for test cases TC-066, TC-068, TC-069, TC-071 and TC-073, written from
the story's acceptance criteria (AC-016 to AC-019) and the reviewed test cases. The
confirmation itself lives in the SPA, so the API side of it is this: a task is removed
only when DELETE /tasks/{id} is called deliberately, the removal is permanent for every
visitor, and deleting the last task leaves an empty list.
"""

from typing import Any

from fastapi.testclient import TestClient


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


def _titles(tasks: list[dict[str, Any]]) -> list[str]:
    """The titles of the listed tasks, in the order they were returned."""
    return [listed["title"] for listed in tasks]


def _entry(tasks: list[dict[str, Any]], task_id: str) -> dict[str, Any]:
    """The listed task with this id."""
    matching = [listed for listed in tasks if listed["id"] == task_id]

    assert len(matching) == 1, tasks
    return matching[0]


def test_tc066_task_stays_on_the_list_until_a_delete_call_is_made(client: TestClient) -> None:
    walk_the_dog = _created(client, "Walk the dog")

    first_read = _listed(client)

    assert "Walk the dog" in _titles(first_read), first_read
    assert _entry(first_read, walk_the_dog["id"])["title"] == "Walk the dog"

    second_read = _listed(client)

    assert "Walk the dog" in _titles(second_read), second_read
    assert _entry(second_read, walk_the_dog["id"])["title"] == "Walk the dog"


def test_tc068_confirmed_delete_call_permanently_removes_the_task(client: TestClient) -> None:
    renew_passport = _created(client, "Renew passport")

    before = _listed(client)

    assert "Renew passport" in _titles(before), before

    deleted = client.delete(f"/tasks/{renew_passport['id']}")

    assert deleted.status_code == 204, deleted.text
    assert deleted.content == b""

    after = _listed(client)

    assert "Renew passport" not in _titles(after), after
    assert all(listed["id"] != renew_passport["id"] for listed in after), after


def test_tc069_deleting_an_already_removed_task_returns_404(client: TestClient) -> None:
    schedule_dentist = _created(client, "Schedule dentist")

    first_delete = client.delete(f"/tasks/{schedule_dentist['id']}")

    assert first_delete.status_code == 204, first_delete.text
    assert first_delete.content == b""

    second_delete = client.delete(f"/tasks/{schedule_dentist['id']}")

    assert second_delete.status_code == 404, second_delete.text


def test_tc071_task_state_including_done_stays_as_it_was_without_a_delete_call(
    client: TestClient,
) -> None:
    water_plants = _created(client, "Water plants")

    patched = client.patch(f"/tasks/{water_plants['id']}", json={"done": True})

    assert patched.status_code == 200, patched.text
    assert patched.json()["id"] == water_plants["id"]
    assert patched.json()["title"] == "Water plants"
    assert patched.json()["done"] is True

    tasks = _listed(client)
    listed = _entry(tasks, water_plants["id"])

    assert listed["title"] == "Water plants"
    assert listed["done"] is True
    assert listed["createdAt"] == water_plants["createdAt"]


def test_tc073_deleting_the_only_remaining_task_returns_an_empty_list(client: TestClient) -> None:
    assert _listed(client) == []

    only_task = _created(client, "Only task")

    tasks = _listed(client)

    assert len(tasks) == 1, tasks
    assert tasks[0]["id"] == only_task["id"]
    assert tasks[0]["title"] == "Only task"

    deleted = client.delete(f"/tasks/{only_task['id']}")

    assert deleted.status_code == 204, deleted.text
    assert deleted.content == b""

    assert _listed(client) == []
