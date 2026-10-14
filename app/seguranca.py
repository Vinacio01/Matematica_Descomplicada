import bcrypt

def gerar_hash(senha: str) -> str:
    senha_bytes = senha.encode("utf-8")
    hash_bytes = bcrypt.hashpw(senha_bytes, bcrypt.gensalt())
    return hash_bytes.decode("utf-8")


def verificar_senha(senha: str, senha_hash: str) -> bool:
    senha_bytes = senha.encode("utf-8")
    if len(senha_bytes) > 72:
        return False
    return bcrypt.checkpw(senha_bytes, senha_hash.encode("utf-8"))

