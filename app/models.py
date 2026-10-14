from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String, unique=True, nullable=False)
    senha_hash = Column(String, nullable=False)
    criada_em = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class SessaoLogin(Base):
    __tablename__ = "sessoes_login"

    token = Column(String, primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    criada_em = Column(DateTime, default=lambda: datetime.now(timezone.utc))