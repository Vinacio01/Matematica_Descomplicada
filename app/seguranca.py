import bcrypt
import hashlib
import hmac


def gerar_token_csrf(token_sessao: str) -> str:
    return hmac.new(token_sessao.encode("utf-8"), b"matematica-csrf-v1", hashlib.sha256).hexdigest()

def gerar_hash(senha: str) -> str:
    senha_bytes = senha.encode("utf-8")
    hash_bytes = bcrypt.hashpw(senha_bytes, bcrypt.gensalt())
    return hash_bytes.decode("utf-8")


def verificar_senha(senha: str, senha_hash: str) -> bool:
    senha_bytes = senha.encode("utf-8")
    if len(senha_bytes) > 72:
        return False
    return bcrypt.checkpw(senha_bytes, senha_hash.encode("utf-8"))

