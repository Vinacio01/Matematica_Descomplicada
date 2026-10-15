from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.database import Base
from sqlalchemy import Boolean

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

class Questao(Base):
    __tablename__ = "questoes"

    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    usuario_id = Column(Integer,ForeignKey("usuarios.id"),nullable=False,)
    enunciado = Column(String, nullable=False)
    operacao = Column(String, nullable=False)
    resposta_certa = Column(Integer, nullable=False)
    respondida = Column(Boolean, default=False, nullable=False,)