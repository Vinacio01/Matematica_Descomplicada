import pytest

from app.jogo import OPERACOES, gerar_conta


def calcular(a, operacao, b):
    if operacao == "+":
        return a + b

    if operacao == "-":
        return a - b

    if operacao == "×":
        return a * b

    return a / b


@pytest.mark.parametrize("operacao", OPERACOES)
def test_resposta_confere_com_a_conta(operacao):
    for _ in range(200):
        conta = gerar_conta(operacao)

        assert conta.resposta == calcular(
            conta.a,
            conta.operacao,
            conta.b,
        )


def test_subtracao_nunca_negativa():
    for _ in range(200):
        conta = gerar_conta("-")

        assert conta.resposta >= 0


def test_divisao_sempre_exata():
    for _ in range(200):
        conta = gerar_conta("÷")

        assert conta.b != 0
        assert conta.a % conta.b == 0


def test_operacao_invalida():
    with pytest.raises(ValueError):
        gerar_conta("?")


def test_enunciado():
    conta = gerar_conta("+")

    assert conta.enunciado == f"{conta.a} + {conta.b}"
