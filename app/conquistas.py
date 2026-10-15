CONQUISTAS = [
    {
        "codigo": "bronze",
        "nome": "Sequência de 5",
        "sequencia_necessaria": 5,
    },
    {
        "codigo": "prata",
        "nome": "Sequência de 10",
        "sequencia_necessaria": 10,
    },
    {
        "codigo": "ouro",
        "nome": "Sequência de 20",
        "sequencia_necessaria": 20,
    },
    {
        "codigo": "trofeu",
        "nome": "Sequência de 50",
        "sequencia_necessaria": 50,
    },
]


def obter_conquista_da_sequencia(sequencia: int) -> dict | None:
    for conquista in CONQUISTAS:
        if conquista["sequencia_necessaria"] == sequencia:
            return conquista

    return None
