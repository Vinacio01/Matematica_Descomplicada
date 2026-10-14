import secrets

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import SessaoLogin, Usuario
from app.schemas import UsuarioCadastro, UsuarioLogin, UsuarioResposta
from app.seguranca import gerar_hash, verificar_senha

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
    db.commit()
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
        max_age=60 * 60 * 24 * 7,
    )
    return usuario