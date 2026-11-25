"""US-010: the app is used anonymously, with no sign-in and no payment.

Integration tests for test cases TC-017, TC-018, TC-019 and TC-021, written from the
story's acceptance criteria (AC-022, AC-023) and the reviewed test cases. The `client`
fixture is a plain caller: it carries no token, no session and no account, so every call
it makes is the first visit of an anonymous visitor.
"""

from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi.testclient import TestClient

# Statuses a payment, billing or subscription wall would answer with.
PAYMENT_STATUSES = (401, 402, 403)
# Words a payment, billing or subscription error would carry.
PAYMENT_WORDS = ("payment", "billing", "subscription", "subscribe", "invoice", "plan", "card")
# How far from "now" a freshly created task's timestamp may sit.
TIMESTAMP_TOLERANCE = timedelta(minutes=5)


def _assert_anonymous(client: TestClient) -> None:
    """The caller holds no credential of any kind: no token, no session, no account."""
    assert "Authorization" not in client.headers, dict(client.headers)
    assert "Cookie" not in client.headers, dict(client.headers)
    assert not client.cookies, dict(client.cookies)


def _assert_no_payment_required(response: Any) -> None:
    """The answer is not a payment, billing or subscription wall."""
    assert response.status_code not in PAYMENT_STATUSES, response.text
    body = response.text.lower()
    for word in PAYMENT_WORDS:
        assert word not in body, response.text


def _assert_timestamped_now(created_at: str) -> None:
    """The creation timestamp is the moment the task was created."""
    assert created_at, created_at
    stamp = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    if stamp.tzinfo is None:
        stamp = stamp.replace(tzinfo=UTC)
    assert abs(datetime.now(UTC) - stamp) <= TIMESTAMP_TOLERANCE, created_at


def _listed(client: TestClient) -> list[dict[str, Any]]:
    """GET /tasks, checked for status 200, and its body."""
    response = client.get("/tasks")

    assert response.status_code == 200, response.text
    return response.json()


def _titles(tasks: list[dict[str, Any]]) -> list[str]:
    return [task["title"] for task in tasks]


def test_tc017_add_a_task_with_no_authentication(client: TestClient) -> None:
    _assert_anonymous(client)

    created = client.post("/tasks", json={"title": "Buy milk"})

    assert created.status_code == 201, created.text
    task = created.json()
    assert task["title"] == "Buy milk"
    assert task["done"] is False
    _assert_timestamped_now(task["createdAt"])

    tasks = _listed(client)

    assert "Buy milk" in _titles(tasks), tasks
    listed = [listed_task for listed_task in tasks if listed_task["id"] == task["id"]]
    assert len(listed) == 1, tasks
    assert listed[0]["title"] == "Buy milk"
    assert listed[0]["done"] is False


def test_tc018_mark_a_task_done_with_no_authentication(client: TestClient) -> None:
    _assert_anonymous(client)

    created = client.post("/tasks", json={"title": "Walk the dog"})

    assert created.status_code == 201, created.text
    task = created.json()
    assert task["title"] == "Walk the dog"
    assert task["done"] is False

    _assert_anonymous(client)

    patched = client.patch(f"/tasks/{task['id']}", json={"done": True})

    assert patched.status_code == 200, patched.text
    assert patched.json()["done"] is True

    tasks = _listed(client)

    listed = [listed_task for listed_task in tasks if listed_task["id"] == task["id"]]
    assert len(listed) == 1, tasks
    assert listed[0]["title"] == "Walk the dog"
    assert listed[0]["done"] is True


def test_tc019_delete_a_task_with_no_authentication(client: TestClient) -> None:
    _assert_anonymous(client)

    created = client.post("/tasks", json={"title": "Call the plumber"})

    assert created.status_code == 201, created.text
    task = created.json()
    assert task["title"] == "Call the plumber"

    _assert_anonymous(client)

    deleted = client.delete(f"/tasks/{task['id']}")

    assert deleted.status_code in (200, 204), deleted.text

    tasks = _listed(client)

    assert task["id"] not in [listed["id"] for listed in tasks], tasks
    assert "Call the plumber" not in _titles(tasks), tasks


def test_tc021_core_task_actions_succeed_with_no_payment_or_billing_information(
    client: TestClient,
) -> None:
    created = client.post("/tasks", json={"title": "Pay rent"})

    assert created.status_code == 201, created.text
    _assert_no_payment_required(created)
    task = created.json()
    assert task["title"] == "Pay rent"
    assert task["done"] is False

    patched = client.patch(f"/tasks/{task['id']}", json={"done": True})

    assert patched.status_code == 200, patched.text
    _assert_no_payment_required(patched)
    assert patched.json()["done"] is True

    deleted = client.delete(f"/tasks/{task['id']}")

    assert deleted.status_code in (200, 204), deleted.text
    _assert_no_payment_required(deleted)

    tasks = _listed(client)

    assert task["id"] not in [listed["id"] for listed in tasks], tasks
    assert "Pay rent" not in _titles(tasks), tasks
