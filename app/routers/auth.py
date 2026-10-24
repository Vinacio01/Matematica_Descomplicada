import os
import secrets

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencias import usuario_logado
from app.models import SessaoLogin, Usuario
from app.schemas import UsuarioCadastro, UsuarioLogin, UsuarioResposta
from app.seguranca import gerar_hash, gerar_token_csrf, verificar_senha

router = APIRouter(prefix="/api", tags=["auth"])


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
    usuario = db.query(Usuario).filter(Usuario.nome == dados.nome).first()
    if not usuario or not verificar_senha(dados.senha, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="Nome ou senha incorretos")

    token = secrets.token_urlsafe(32)
    db.add(SessaoLogin(token=token, usuario_id=usuario.id))
    db.commit()

    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=os.getenv("APP_COOKIE_SECURE", "0") == "1",
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
