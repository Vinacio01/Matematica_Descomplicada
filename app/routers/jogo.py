import random
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.conquistas import obter_conquista_da_sequencia
from app.database import get_db
from app.dependencias import usuario_logado
from app.jogo import gerar_conta, sortear_operacao
from app.models import Conquista, DesbloqueioQuestao, Progresso, Questao, RespostaQuestao, Usuario
from app.schemas import (
    ConquistaResposta,
    ListaConquistaResposta,
    ProgressoResposta,
    QuestaoResposta,
    ResponderQuestao,
    ResultadoResposta,
)

router = APIRouter(prefix="/api", tags=["jogo"])


def _alternativas(resposta: int) -> list[int]:
    offsets = [-10, -5, -3, -2, -1, 1, 2, 3, 5, 10]
    random.shuffle(offsets)
    valores = {resposta}
    for offset in offsets:
        candidato = resposta + offset
        if candidato >= 0:
            valores.add(candidato)
        if len(valores) == 4:
            break
    while len(valores) < 4:
        valores.add(resposta + len(valores))
    resultado = list(valores)
    random.shuffle(resultado)
    return resultado


def _questao_resposta(questao: Questao, formato: str) -> QuestaoResposta:
    return QuestaoResposta(
        id=questao.id,
        enunciado=questao.enunciado,
        operacao=questao.operacao,
        alternativas=_alternativas(questao.resposta_certa) if formato == "alternativas" else None,
    )


def _questao_pendente(usuario: Usuario, db: Session) -> Questao | None:
    return (
        db.query(Questao)
        .filter(Questao.usuario_id == usuario.id, Questao.respondida.is_(False))
        .order_by(Questao.id.desc())
        .first()
    )


def _resultado_repetido(db: Session, questao: Questao, resposta: int) -> ResultadoResposta:
    anterior = db.get(RespostaQuestao, questao.id)
    if not anterior or anterior.resposta != resposta:
        raise HTTPException(status_code=409, detail="Essa questão já foi respondida")
    desbloqueio = db.get(DesbloqueioQuestao, questao.id)
    conquista = None
    if desbloqueio:
        conquista = (
            db.query(Conquista)
            .filter(
                Conquista.usuario_id == questao.usuario_id,
                Conquista.codigo == desbloqueio.conquista_codigo,
            )
            .first()
        )
    return ResultadoResposta(
        correta=anterior.correta,
        mensagem="Resposta correta!" if anterior.correta else "Resposta incorreta.",
        conquista=ConquistaResposta(codigo=conquista.codigo, nome=conquista.nome) if conquista else None,
    )


@router.get("/questao", response_model=QuestaoResposta)
def obter_questao(
    formato: Literal["digitada", "alternativas"] = "digitada",
    usuario: Usuario = Depends(usuario_logado),
    db: Session = Depends(get_db),
):
    questao = _questao_pendente(usuario, db)
    if questao is None:
        raise HTTPException(status_code=404, detail="Nenhuma questão pendente")
    return _questao_resposta(questao, formato)


@router.post("/questao", response_model=QuestaoResposta)
def criar_questao(
    formato: Literal["digitada", "alternativas"] = "digitada",
    usuario: Usuario = Depends(usuario_logado),
    db: Session = Depends(get_db),
):
    pendente = _questao_pendente(usuario, db)
    if pendente is not None:
        return _questao_resposta(pendente, formato)

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

    return _questao_resposta(nova_questao, formato)


@router.post("/responder", response_model=ResultadoResposta)
def responder_questao(
    dados: ResponderQuestao,
    usuario: Usuario = Depends(usuario_logado),
    db: Session = Depends(get_db),
):
    questao = (
        db.query(Questao)
        .filter(
            Questao.id == dados.questao_id,
            Questao.usuario_id == usuario.id,
        )
        .first()
    )

    if not questao:
        raise HTTPException(
            status_code=404,
            detail="Questão não encontrada",
        )

    if questao.respondida:
        return _resultado_repetido(db, questao, dados.resposta)

    acertou = dados.resposta == questao.resposta_certa

    progresso = (
        db.query(Progresso)
        .filter(Progresso.usuario_id == usuario.id)
        .first()
    )

    if not progresso:
        progresso = Progresso(
            usuario_id=usuario.id,
            acertos=0,
            erros=0,
            sequencia_atual=0,
            recorde=0,
        )
        db.add(progresso)
        db.flush()

    conquista_nova = None

    if acertou:
        progresso.acertos += 1
        progresso.sequencia_atual += 1

        if progresso.sequencia_atual > progresso.recorde:
            progresso.recorde = progresso.sequencia_atual

        configuracao = obter_conquista_da_sequencia(
            progresso.sequencia_atual
        )

        if configuracao:
            conquista_existente = (
                db.query(Conquista)
                .filter(
                    Conquista.usuario_id == usuario.id,
                    Conquista.codigo == configuracao["codigo"],
                )
                .first()
            )

            if not conquista_existente:
                conquista_nova = Conquista(
                    usuario_id=usuario.id,
                    codigo=configuracao["codigo"],
                    nome=configuracao["nome"],
                )
                db.add(conquista_nova)

    else:
        progresso.erros += 1
        progresso.sequencia_atual = 0

    questao.respondida = True
    db.add(RespostaQuestao(questao_id=questao.id, resposta=dados.resposta, correta=acertou))
    if conquista_nova:
        db.add(DesbloqueioQuestao(questao_id=questao.id, conquista_codigo=conquista_nova.codigo))

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return _resultado_repetido(db, questao, dados.resposta)

    conquista_resposta = None

    if conquista_nova:
        conquista_resposta = ConquistaResposta(
            codigo=conquista_nova.codigo,
            nome=conquista_nova.nome,
        )

    if acertou:
        return ResultadoResposta(
            correta=True,
            mensagem="Resposta correta!",
            conquista=conquista_resposta,
        )

    return ResultadoResposta(
        correta=False,
        mensagem="Resposta incorreta.",
        conquista=None,
    )


@router.get("/progresso", response_model=ProgressoResposta)
def obter_progresso(
    usuario: Usuario = Depends(usuario_logado),
    db: Session = Depends(get_db),
):
    progresso = (
        db.query(Progresso)
        .filter(Progresso.usuario_id == usuario.id)
        .first()
    )

    if not progresso:
        return ProgressoResposta(acertos=0, erros=0, sequencia_atual=0, recorde=0)

    return ProgressoResposta(
        acertos=progresso.acertos,
        erros=progresso.erros,
        sequencia_atual=progresso.sequencia_atual,
        recorde=progresso.recorde,
    )

@router.get(
    "/conquistas",
    response_model=list[ListaConquistaResposta],
)
def listar_conquistas(
    usuario: Usuario = Depends(usuario_logado),
    db: Session = Depends(get_db),
):
    conquistas = (
        db.query(Conquista)
        .filter(Conquista.usuario_id == usuario.id)
        .order_by(Conquista.id)
        .all()
    )

    return conquistas
