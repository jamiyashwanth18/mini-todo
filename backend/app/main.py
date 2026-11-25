"""Application entrypoint.

Generated from the approved architecture: one router per component that owns
endpoints, one route per endpoint the API spec declares. Every generated route
is a stub that returns a typed placeholder, so the service starts, serves its
OpenAPI document and passes its tests before a single handler is implemented.
"""

import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path
from typing import TYPE_CHECKING

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect

from app import auth
from app.database import DATABASE_URL, engine
from app.routers import tasks
from app.seed import seed_from_env

if TYPE_CHECKING:  # imported for the annotation only; Alembic is loaded on startup below.
    from alembic.script import ScriptDirectory

_ALEMBIC_INI = Path(__file__).resolve().parent.parent / "alembic.ini"


def prepare_database() -> None:
    """Bring the database up to the migrations when the application starts.

    The schema comes from the Alembic migrations in alembic/versions/, never from
    `create_all`, which cannot change a table that already exists. A database that
    `create_all` built before there were migrations has tables but no migration record:
    the first migration describes what it built, so it is marked as applied and only the
    later ones run.
    """
    if not _ALEMBIC_INI.is_file():
        raise RuntimeError(
            "alembic.ini is missing beside app/, so the database cannot be prepared. "
            "Restore alembic.ini and alembic/ (the Dockerfile copies both into the image)."
        )
    from alembic import command
    from alembic.config import Config
    from alembic.script import ScriptDirectory

    config = Config(str(_ALEMBIC_INI))
    config.set_main_option("script_location", str(_ALEMBIC_INI.parent / "alembic"))
    config.set_main_option("sqlalchemy.url", DATABASE_URL.replace("%", "%%"))
    tables = set(inspect(engine).get_table_names())
    if tables and "alembic_version" not in tables:
        command.stamp(config, _first_revision(ScriptDirectory.from_config(config)))
    command.upgrade(config, "head")


def _first_revision(scripts: "ScriptDirectory") -> str:
    """The revision a legacy database is stamped with: the one migration without a parent.

    `get_bases()` is the revision map's own answer, a list because a script directory may
    hold several unrelated histories. Ours holds exactly one, and a database stamped with
    the wrong revision would either re-run a migration over tables that exist or skip one
    that has not run, so anything else is refused here rather than half-applied.
    """
    bases = scripts.get_bases()
    if len(bases) != 1:
        raise RuntimeError(
            "alembic/versions/ must hold exactly one migration history to stamp a database "
            f"built before there were migrations, but it has {len(bases)} base revisions: "
            f"{sorted(bases)}."
        )
    return bases[0]


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Prepares the database and seeds the first users (app/seed.py) on startup and not at
    import, so importing the application never opens a connection. A test can therefore
    point `get_db` at a database of its own, and a deployment whose `DATABASE_URL` names a
    server that is not up fails where you can read the error, not while pytest collects.
    """
    prepare_database()
    seed_from_env()
    yield


app = FastAPI(
    title="Mini Todo",
    description="Mini Todo is a very small web app to keep a to-do list. No sign-in. A user can add a task with a title (required, max 100 characters). The user sees all tasks in a list, newest first, with a message when there are no tasks. The user can mark a task as done (shown struck through) and can delete a task after confirming. Two sprints only: sprint 1 is add task and list tasks; sprint 2 is mark done and delete. Keep it minimal.",  # noqa: E501
    version="0.1.0",
    lifespan=lifespan,
)

# The SPA runs on a different origin than the API, so the browser refuses its calls
# unless that origin is allowed here. In development that is the Vite dev server; when
# deployed, the platform injects the frontend's real URL as ALLOWED_ORIGINS (comma
# separated). Point ALLOWED_ORIGINS at the real thing and nothing else has to change.
_dev_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
_allowed_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins or _dev_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(tasks.router)


@app.get("/health")
async def health() -> dict[str, str]:
    """Liveness probe, and the only route here that is not a stub."""
    return {"status": "ok"}
