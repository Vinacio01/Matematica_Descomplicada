from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

URL_BANCO = "sqlite:///./matematica.db"

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
