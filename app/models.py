from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    nome = Column(
        String,
        unique=True,
        nullable=False,
    )

    senha_hash = Column(
        String,
        nullable=False,
    )

    criada_em = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
    )


class SessaoLogin(Base):
    __tablename__ = "sessoes_login"

    token = Column(
        String,
        primary_key=True,
    )

    usuario_id = Column(
        Integer,
        ForeignKey("usuarios.id"),
        nullable=False,
    )

    criada_em = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
    )


class Questao(Base):
    __tablename__ = "questoes"

    id = Column(Integer, primary_key=True, autoincrement=True,)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"),nullable=False,)
    enunciado = Column(String, nullable=False,)
    operacao = Column(String, nullable=False,)
    resposta_certa = Column(Integer, nullable=False,)
    respondida = Column(Boolean, default=False, nullable=False,)

class Progresso(Base):
    __tablename__ = "progressos"

    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    usuario_id = Column(
        Integer,
        ForeignKey("usuarios.id"),
        unique=True,
        nullable=False,
    )

    acertos = Column(
        Integer,
        default=0,
        nullable=False,
    )

    erros = Column(
        Integer,
        default=0,
        nullable=False,
    )

    sequencia_atual = Column(
        Integer,
        default=0,
        nullable=False,
    )

    recorde = Column(
        Integer,
        default=0,
        nullable=False,
    )
