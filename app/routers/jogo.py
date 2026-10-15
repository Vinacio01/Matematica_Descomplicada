from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.conquistas import obter_conquista_da_sequencia
from app.database import get_db
from app.dependencias import usuario_logado
from app.jogo import gerar_conta, sortear_operacao
from app.models import Conquista, Progresso, Questao, Usuario
from app.schemas import (
    ConquistaResposta,
    ListaConquistaResposta,
    ProgressoResposta,
    QuestaoResposta,
    ResponderQuestao,
    ResultadoResposta,
)

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
        raise HTTPException(
            status_code=404,
            detail="Essa questão já foi respondida",
        )

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

    db.commit()

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
        progresso = Progresso(
            usuario_id=usuario.id,
            acertos=0,
            erros=0,
            sequencia_atual=0,
            recorde=0,
        )

        db.add(progresso)
        db.commit()
        db.refresh(progresso)

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