from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencias import usuario_logado
from app.jogo import gerar_conta, sortear_operacao
from app.models import Questao, Usuario
from app.schemas import QuestaoResposta


router = APIRouter(prefix="/api", tags=["jogo"])


@router.get("/questao", response_model=QuestaoResposta)
def obter_questao(
    usuario: Usuario = Depends(usuario_logado),
    db: Session = Depends(get_db),
):
    operacao = sortear_operacao()
    conta = gerar_conta(operacao)

    nova_questao = Questao(
        usuario_id=usuario.id,
        enunciado=conta.enunciado,
        operacao=conta.operacao,
        resposta_certa=conta.resposta,
    )

    db.add(nova_questao)
    db.commit()
    db.refresh(nova_questao)

    return nova_questao
