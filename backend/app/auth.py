"""Sign-in: an email and a password in, a bearer token out.

Part of the scaffold's test kit, so the seed script, the signed-in test client and the
smoke check have a real login from the first commit. The frontend and the API are on
different origins once deployed, so the token travels in the response body and comes back
as `Authorization: Bearer <token>`, never as a cookie.

JWT_SECRET_KEY signs the tokens, SECRET_KEY after it. Without either (local runs, tests) a
random key is made per process and a warning says so: tokens then stop working on restart,
and two worker processes do not accept each other's, so a deployed app must set one.

An email names one account whatever case it is typed in: it is trimmed and lower-cased
before it is stored and before it is looked up, so Ada@Example.com and ada@example.com are
the same user rather than two.
"""

import logging
import os
import secrets
from datetime import UTC, datetime, timedelta
from typing import Annotated
from uuid import uuid4

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api_model import ApiModel
from app.database import get_db
from app.models import User

ADMIN_ROLE = "admin"
USER_ROLE = "user"
TOKEN_LIFETIME = timedelta(hours=12)

_ALGORITHM = "HS256"
_log = logging.getLogger(__name__)


def _signing_key() -> str:
    """The key the tokens are signed with, from a setting whenever one is set.

    A key made here lives in this process only: another worker signs with a different one
    and rejects this one's tokens, so the fallback is announced rather than silent.
    """
    configured = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY")
    if configured:
        return configured
    _log.warning(
        "Neither JWT_SECRET_KEY nor SECRET_KEY is set: signing tokens with a key made for "
        "this process. Tokens stop working on restart and are refused by every other "
        "worker. Set JWT_SECRET_KEY anywhere the app runs for real."
    )
    return secrets.token_urlsafe(32)


_SECRET = _signing_key()
_bearer = HTTPBearer(auto_error=False)

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginRequest(ApiModel):
    email: str
    password: str


class LoginResponse(ApiModel):
    # "token", not "access_token": one word reads the same in camelCase, and it is a name
    # the platform's smoke check looks for.
    token: str


class CurrentUser(ApiModel):
    id: str
    email: str
    role: str


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except ValueError:  # not a bcrypt hash
        return False


def normalize_email(email: str) -> str:
    """One spelling per address: trimmed and lower-cased, however it was typed."""
    return email.strip().lower()


def find_user(session: Session, email: str) -> User | None:
    """The user with this email, whatever case it is given or was stored in."""
    wanted = normalize_email(email)
    return session.scalars(select(User).where(func.lower(User.email) == wanted)).first()


def ensure_user(session: Session, *, email: str, password: str, role: str) -> bool:
    """Create the user unless one with this email exists. True when it was created.

    The email column is unique, so two callers seeding the same user at the same moment
    cannot both insert it: the second insert breaks that constraint, and this reports the
    user as already there rather than failing. The insert runs in a savepoint so a refused
    one leaves the caller's transaction, and everything it had already done, intact.
    """
    if find_user(session, email) is not None:
        return False
    user = User(
        id=str(uuid4()),
        email=normalize_email(email),
        password_hash=hash_password(password),
        role=role,
    )
    try:
        with session.begin_nested():
            session.add(user)
    except IntegrityError:
        return False
    return True


def issue_token(user: User) -> str:
    now = datetime.now(UTC)
    claims = {
        "sub": user.id,
        "role": user.role,
        "iat": now,
        "exp": now + TOKEN_LIFETIME,
    }
    return jwt.encode(claims, _SECRET, algorithm=_ALGORITHM)


def _refused() -> HTTPException:
    return HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        "Sign in first.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    session: Annotated[Session, Depends(get_db)],
) -> User:
    """The signed-in user. Add `Depends(current_user)` to any route that needs one."""
    if credentials is None:
        raise _refused()
    try:
        claims = jwt.decode(credentials.credentials, _SECRET, algorithms=[_ALGORITHM])
        user_id = str(claims["sub"])
    except (jwt.PyJWTError, KeyError):
        raise _refused() from None
    user = session.get(User, user_id)
    if user is None:
        raise _refused()
    return user


@router.post("/login")
def login(body: LoginRequest, session: Annotated[Session, Depends(get_db)]) -> LoginResponse:
    user = find_user(session, body.email)
    if user is None or not verify_password(body.password, user.password_hash or ""):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Wrong email or password.")
    return LoginResponse(token=issue_token(user))


@router.get("/me")
def me(user: Annotated[User, Depends(current_user)]) -> CurrentUser:
    return CurrentUser(id=user.id, email=user.email, role=user.role)
