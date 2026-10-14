from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Usuario
from app.schemas import UsuarioCadastro, UsuarioResposta
from app.seguranca import gerar_hash

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