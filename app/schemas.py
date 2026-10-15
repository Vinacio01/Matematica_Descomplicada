from pydantic import BaseModel, Field, field_validator
from datetime import datetime


class UsuarioCadastro(BaseModel):
    nome: str = Field(min_length=3, max_length=30)
    senha: str = Field(min_length=4)

    @field_validator("senha")
    @classmethod
    def senha_nao_pode_passar_de_72_bytes(cls, valor: str) -> str:
        if len(valor.encode("utf-8")) > 72:
            raise ValueError("A senha é longa demais")

        return valor


class UsuarioResposta(BaseModel):
    id: int
    nome: str

    model_config = {"from_attributes": True}


class UsuarioLogin(BaseModel):
    nome: str
    senha: str


class QuestaoResposta(BaseModel):
    id: int
    enunciado: str
    operacao: str

    model_config = {"from_attributes": True}


class ResponderQuestao(BaseModel):
    questao_id: int = Field(gt=0)
    resposta: int


class ConquistaResposta(BaseModel):
    codigo: str
    nome: str


class ResultadoResposta(BaseModel):
    correta: bool
    mensagem: str
    conquista: ConquistaResposta | None = None


class ProgressoResposta(BaseModel):
    acertos: int
    erros: int
    sequencia_atual: int
    recorde: int

class ListaConquistaResposta(BaseModel):
    id: int
    codigo: str
    nome: str
    desbloqueada_em: datetime

    model_config = {"from_attributes": True}