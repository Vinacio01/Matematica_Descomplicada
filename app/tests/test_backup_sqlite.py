"""Backup e restauração apenas de bancos fictícios em diretórios temporários."""

import os
from pathlib import Path
import shutil
import sqlite3
import subprocess
import sys

from scripts.backup_sqlite import criar_backup


ROOT = Path(__file__).resolve().parents[2]


def test_backup_and_temporary_restore(tmp_path):
    origem = tmp_path / "ficticio.db"
    pasta = tmp_path / "backups"
    pasta.mkdir()
    with sqlite3.connect(origem) as db:
        db.execute("CREATE TABLE alunos (nome TEXT NOT NULL)")
        db.execute("INSERT INTO alunos VALUES ('Aluno Ficticio')")

    primeiro = criar_backup(origem, pasta)
    segundo = criar_backup(origem, pasta)
    assert primeiro != segundo
    assert primeiro.is_file() and segundo.is_file()
    assert primeiro.parent == pasta
    assert origem.is_file()
    if os.name == "posix":
        assert primeiro.stat().st_mode & 0o077 == 0

    restaurado = tmp_path / "restaurado.db"
    shutil.copy2(primeiro, restaurado)
    with sqlite3.connect(restaurado) as db:
        assert db.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
        assert db.execute("SELECT nome FROM alunos").fetchone()[0] == "Aluno Ficticio"
        db.execute("INSERT INTO alunos VALUES ('Outro Ficticio')")
    with sqlite3.connect(origem) as db:
        assert db.execute("SELECT COUNT(*) FROM alunos").fetchone()[0] == 1


def test_backup_cli_uses_configured_paths(tmp_path):
    origem = tmp_path / "ficticio.db"
    pasta = tmp_path / "backups"
    pasta.mkdir()
    with sqlite3.connect(origem) as db:
        db.execute("CREATE TABLE exemplo (valor INTEGER)")
        db.execute("INSERT INTO exemplo VALUES (42)")
    env = os.environ.copy()
    env.update(APP_DATABASE_PATH=str(origem), APP_BACKUP_DIR=str(pasta))
    resultado = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "backup_sqlite.py")],
        env=env, capture_output=True, text=True, check=True,
    )
    copia = Path(resultado.stdout.strip())
    assert copia.parent == pasta and copia != origem
    with sqlite3.connect(copia) as db:
        assert db.execute("SELECT valor FROM exemplo").fetchone()[0] == 42
