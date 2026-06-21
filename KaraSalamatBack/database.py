import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
if not SQLALCHEMY_DATABASE_URI:
    raise ValueError("DATABASE_URL environment variable not set")

engine = create_engine(
    SQLALCHEMY_DATABASE_URI,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def init_db():
    """Run Alembic migrations at startup. Set SKIP_MIGRATIONS=true to bypass."""
    if os.getenv("SKIP_MIGRATIONS", "").lower() in ("true", "1", "yes"):
        return
    from alembic.config import Config
    from alembic import command

    alembic_cfg = Config(os.path.join(os.path.dirname(__file__), "alembic.ini"))
    command.upgrade(alembic_cfg, "head")