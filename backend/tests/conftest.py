import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DELTA_SPEND_DATABASE_URL", "sqlite://")
os.environ.setdefault("DELTA_SPEND_DATABASE_URL", "sqlite:///./test_delta_spend.db")

from app.db.base import Base
from app.db.session import engine
from app.main import app


@pytest.fixture(autouse=True)
def reset_db():
    db_file = Path("test_delta_spend.db")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if db_file.exists():
        db_file.unlink()


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client
