"""The errors the API returns: one constant per error an endpoint can answer with.

A route declares the errors it may return in its `responses=`, and raises the same
constant when it does, so the exported OpenAPI document and the service never drift
apart on a status code or on what it means.
"""

from dataclasses import dataclass
from typing import Any

from fastapi import HTTPException, status


@dataclass(frozen=True)
class ApiError:
    """One failure an endpoint can answer with: its HTTP status and a short message."""

    status_code: int
    message: str

    def http(self, message: str | None = None) -> HTTPException:
        """This error as the exception a handler raises, optionally said more precisely."""
        return HTTPException(self.status_code, message or self.message)

    @property
    def response(self) -> dict[str, Any]:
        """This error as the `responses=` entry that documents it in the OpenAPI spec."""
        return {"description": self.message}


UNUSABLE_TASK_BODY = ApiError(
    status.HTTP_400_BAD_REQUEST,
    "The request body breaks a rule of its model (a blank title, a title longer than "
    "100 characters, or a missing done status); the answer names the field and the rule.",
)

TASK_NOT_FOUND = ApiError(
    status.HTTP_404_NOT_FOUND,
    "No task with this id is on the list.",
)
