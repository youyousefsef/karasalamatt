import os
import sys
from pathlib import Path

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("OTP_MOCK", "true")
os.environ.setdefault("OTP_EXP_DAYS", "30")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")
os.environ["SKIP_MIGRATIONS"] = "true"

backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session as SASession
from unittest.mock import patch

from database import SessionLocal
from models import Base
from main import app
from routers.authentication import get_db, SECRET_KEY, ALGORITHM, hash_otp
from datetime import datetime, timezone, timedelta
from jose import jwt


@pytest.fixture(scope="session")
def db_engine():
    engine = create_engine("sqlite:///./test.db", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    Session = sessionmaker(bind=connection)
    session = Session()
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def admin_token():
    payload = {
        "sub": "09120000000",
        "id": 1,
        "role": "admin",
        "subb": 1,
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


@pytest.fixture
def user_token():
    payload = {
        "sub": "09120000001",
        "id": 2,
        "role": "user",
        "subb": 2,
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
