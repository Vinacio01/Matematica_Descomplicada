from pydantic import BaseModel, Field, field_validator


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