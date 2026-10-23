from datetime import datetime, timedelta, timezone

from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import SessaoLogin, Usuario


def usuario_logado(
    token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> Usuario:
    if not token:
        raise HTTPException(status_code=401, detail="Faça login para continuar")

    sessao = db.query(SessaoLogin).filter(SessaoLogin.token == token).first()
    if not sessao:
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada")

    criada_em = sessao.criada_em
    if criada_em.tzinfo is None:
        criada_em = criada_em.replace(tzinfo=timezone.utc)
    if criada_em + timedelta(days=7) <= datetime.now(timezone.utc):
        db.delete(sessao)
        db.commit()
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada")

    usuario = db.get(Usuario, sessao.usuario_id)
    if not usuario:
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada")

    return usuario
