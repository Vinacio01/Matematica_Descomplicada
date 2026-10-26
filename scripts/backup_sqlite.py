"""Cria uma cópia consistente do SQLite, sem escrever no banco de origem."""

import os
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
import secrets
import sqlite3


def criar_backup(origem: Path, diretorio: Path) -> Path:
    origem = origem.expanduser().resolve(strict=True)
    if not origem.is_file():
        raise ValueError("O banco de origem não é um arquivo")
    diretorio = diretorio.expanduser().resolve(strict=True)
    if not diretorio.is_dir():
        raise ValueError("O destino não é um diretório")

    instante = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    destino = diretorio / f"matematica-{instante}-{secrets.token_hex(4)}.db"
    descritor = os.open(destino, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    os.close(descritor)
    try:
        with closing(sqlite3.connect(f"{origem.as_uri()}?mode=ro", uri=True)) as fonte:
            with closing(sqlite3.connect(destino)) as copia:
                fonte.backup(copia)
                resultado = copia.execute("PRAGMA integrity_check").fetchone()[0]
                if resultado != "ok":
                    raise RuntimeError(f"Backup inválido: {resultado}")
        os.chmod(destino, 0o600)
    except BaseException:
        destino.unlink()
        raise
    return destino


if __name__ == "__main__":
    caminho = os.environ.get("APP_DATABASE_PATH")
    pasta = os.environ.get("APP_BACKUP_DIR")
    if not caminho or not pasta:
        raise SystemExit("Configure APP_DATABASE_PATH e APP_BACKUP_DIR com caminhos absolutos")
    if not Path(caminho).is_absolute() or not Path(pasta).is_absolute():
        raise SystemExit("APP_DATABASE_PATH e APP_BACKUP_DIR devem ser absolutos")
    print(criar_backup(Path(caminho), Path(pasta)))
