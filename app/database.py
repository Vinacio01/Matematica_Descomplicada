import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

_configured_path = os.getenv("APP_DATABASE_PATH")
DATABASE_PATH = (
    Path(_configured_path).expanduser()
    if _configured_path
    else Path(__file__).resolve().parents[1] / "matematica.db"
)
if not DATABASE_PATH.is_absolute():
    raise ValueError("APP_DATABASE_PATH deve ser um caminho absoluto")
DATABASE_PATH = DATABASE_PATH.resolve()
URL_BANCO = f"sqlite:///{DATABASE_PATH.as_posix()}"

engine = create_engine (
    URL_BANCO, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker (autocommit = False, autoflush= False , bind= engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
