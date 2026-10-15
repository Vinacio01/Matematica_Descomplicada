import random
from dataclasses import dataclass


OPERACOES = ["+", "-", "×", "÷"]


@dataclass
class Conta:
    a: int
    operacao: str
    b: int
    resposta: int

    @property
    def enunciado(self) -> str:
        return f"{self.a} {self.operacao} {self.b}"


def sortear_operacao() -> str:
    return random.choice(OPERACOES)


def gerar_conta(operacao: str) -> Conta:
    if operacao == "+":
        a = random.randint(1, 50)
        b = random.randint(1, 50)
        resposta = a + b

    elif operacao == "-":
        a = random.randint(1, 50)
        b = random.randint(1, 50)

        a, b = max(a, b), min(a, b)
        resposta = a - b

    elif operacao == "×":
        a = random.randint(1, 10)
        b = random.randint(1, 10)
        resposta = a * b

    elif operacao == "÷":
        b = random.randint(1, 10)
        resposta = random.randint(1, 10)
        a = b * resposta

    else:
        raise ValueError(f"Operação inválida: {operacao}")

    return Conta(
        a=a,
        operacao=operacao,
        b=b,
        resposta=resposta,
    )
