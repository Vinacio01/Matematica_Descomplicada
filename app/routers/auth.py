import os
import secrets
import hashlib
from datetime import datetime, timedelta, timezone

import bcrypt

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencias import usuario_logado
from app.models import LimiteLogin, SessaoLogin, Usuario
from app.schemas import UsuarioCadastro, UsuarioLogin, UsuarioResposta
from app.seguranca import gerar_hash, gerar_token_csrf, verificar_senha

router = APIRouter(prefix="/api", tags=["auth"])

MAX_FALHAS_LOGIN = 5
JANELA_LOGIN = timedelta(minutes=15)
# O mesmo custo de bcrypt para nomes existentes e inexistentes evita uma pista de enumeração.
HASH_FICTICIO = bcrypt.hashpw(b"conta-inexistente", bcrypt.gensalt()).decode("ascii")


@router.post(
    "/cadastro",
    response_model=UsuarioResposta,
    status_code=status.HTTP_201_CREATED,
)
def cadastrar(dados: UsuarioCadastro, db: Session = Depends(get_db)):
    existente = db.query(Usuario).filter(Usuario.nome == dados.nome).first()
    if existente:
        raise HTTPException(status_code=409, detail="Esse nome já está em uso")

    novo = Usuario(nome=dados.nome, senha_hash=gerar_hash(dados.senha))
    db.add(novo)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Esse nome já está em uso") from None
    db.refresh(novo)
    return novo


@router.post("/login", response_model=UsuarioResposta)
def login(dados: UsuarioLogin, response: Response, db: Session = Depends(get_db)):
    # A transação impede que requisições simultâneas ultrapassem o limite no SQLite.
    db.connection().exec_driver_sql("BEGIN IMMEDIATE")
    agora = datetime.now(timezone.utc).replace(tzinfo=None)
    db.query(LimiteLogin).filter(LimiteLogin.expira_em <= agora).delete(synchronize_session=False)
    chave = hashlib.sha256(dados.nome.encode("utf-8")).hexdigest()
    limite = db.get(LimiteLogin, chave)
    if limite and limite.falhas >= MAX_FALHAS_LOGIN:
        raise HTTPException(status_code=429, detail="Muitas tentativas. Tente novamente mais tarde.",
                            headers={"Retry-After": str(max(1, int((limite.expira_em - agora).total_seconds()) + 1))})

    usuario = db.query(Usuario).filter(Usuario.nome == dados.nome).first()
    senha_valida = verificar_senha(dados.senha, usuario.senha_hash if usuario else HASH_FICTICIO)
    if not usuario or not senha_valida:
        if limite is None:
            limite = LimiteLogin(conta_hash=chave, falhas=0, expira_em=agora + JANELA_LOGIN)
            db.add(limite)
        limite.falhas += 1
        bloqueado = limite.falhas >= MAX_FALHAS_LOGIN
        db.commit()
        if bloqueado:
            raise HTTPException(status_code=429, detail="Muitas tentativas. Tente novamente mais tarde.",
                                headers={"Retry-After": str(int(JANELA_LOGIN.total_seconds()))})
        raise HTTPException(status_code=401, detail="Nome ou senha incorretos")

    if limite:
        db.delete(limite)
    token = secrets.token_urlsafe(32)
    db.add(SessaoLogin(token=token, usuario_id=usuario.id))
    db.commit()

    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=(os.getenv("APP_COOKIE_SECURE") == "1" or
                os.getenv("APP_PUBLIC_ORIGIN", "").startswith("https://")),
        max_age=60 * 60 * 24 * 7,
    )
    return usuario


@router.get("/eu", response_model=UsuarioResposta)
def eu(usuario: Usuario = Depends(usuario_logado)):
    return usuario


@router.get("/csrf")
def csrf(
    response: Response,
    token: str | None = Cookie(default=None),
    usuario: Usuario = Depends(usuario_logado),
):
    assert token is not None
    response.headers["Cache-Control"] = "no-store"
    return {"csrf_token": gerar_token_csrf(token)}

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    if token:
        db.query(SessaoLogin).filter(SessaoLogin.token == token).delete()
        db.commit()
    response.delete_cookie(key="token", httponly=True, samesite="lax")
