"""HTTP smoke test of the served interface and cookie authentication."""

import http.cookiejar
import os
from pathlib import Path
import socket
import sqlite3
import subprocess
import sys
import time
import urllib.error
import urllib.request
import json

import bcrypt
import pytest


ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture(scope="module")
def server(tmp_path_factory):
    work = tmp_path_factory.mktemp("auth-server")
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]
    env = os.environ.copy()
    env["PYTHONPATH"] = str(ROOT)
    process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(port)],
        cwd=work, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE,
    )
    base = f"http://127.0.0.1:{port}"
    for _ in range(100):
        if process.poll() is not None:
            raise AssertionError(process.stderr.read().decode())
        try:
            urllib.request.urlopen(base + "/", timeout=0.2).close()
            break
        except urllib.error.URLError:
            time.sleep(0.05)
    else:
        process.terminate()
        raise AssertionError("FastAPI did not start")
    try:
        yield base, work
    finally:
        process.terminate()
        process.wait(timeout=5)


def request(base, path, payload=None, jar=None, headers=None):
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar if jar is not None else http.cookiejar.CookieJar()))
    body = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(
        base + path, data=body,
        headers={"Content-Type": "application/json", **(headers or {})},
        method="POST" if payload is not None else "GET",
    )
    try:
        response = opener.open(req)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        return response.status, response.read(), response.headers


def test_frontend_and_authentication(server):
    base, work = server
    for path, expected in [
        ("/", b"Matem"), ("/index.html", b"Matem"),
        ("/access.html", b"access-form"),
        ("/design-system.css", b"font"),
        ("/access.js", b"/api/login"),
        ("/assets/mascot-turquoise.svg", b"<svg"),
        ("/docs", b"swagger"),
    ]:
        status, body, _ = request(base, path)
        assert status == 200 and expected in body

    protected = ["dashboard", "game-modes", "exercises", "progress", "achievements", "game-result"]
    for page in protected:
        assert request(base, f"/{page}.html")[0] == 401
        status, body, _ = request(base, f"/{page}.html", headers={"Accept": "text/html"})
        assert status == 200 and b"access-form" in body
    assert request(base, "/api/eu")[0] == 401
    for path in ("/api/questao", "/api/progresso", "/api/conquistas"):
        assert request(base, path)[0] == 401
    assert request(base, "/api/responder", {"questao_id": 1, "resposta": 0})[0] == 401

    assert request(base, "/api/cadastro", {"nome": "AlunoTeste", "senha": "12345"})[0] == 422
    assert request(base, "/api/cadastro", {"nome": "An", "senha": "123456"})[0] == 422
    assert request(base, "/api/cadastro", {"nome": "AlunoTeste", "senha": "á" * 37})[0] == 422
    assert request(base, "/api/cadastro", {"nome": "LimiteSenha", "senha": "á" * 36})[0] == 201
    assert request(base, "/api/login", {"nome": "LimiteSenha", "senha": "á" * 36})[0] == 200
    assert request(base, "/api/cadastro", {"nome": "AlunoTeste", "senha": "123456"})[0] == 201
    assert request(base, "/api/cadastro", {"nome": "AlunoTeste", "senha": "123456"})[0] == 409
    assert request(base, "/api/login", {"nome": "AlunoTeste", "senha": "errada"})[0] == 401

    jar = http.cookiejar.CookieJar()
    status, body, headers = request(base, "/api/login", {"nome": "AlunoTeste", "senha": "123456"}, jar)
    assert status == 200 and json.loads(body)["nome"] == "AlunoTeste"
    assert "httponly" in headers["Set-Cookie"].lower()
    assert "samesite=lax" in headers["Set-Cookie"].lower()
    old_token = next(cookie.value for cookie in jar if cookie.name == "token")
    assert request(base, "/api/eu", jar=jar)[0] == 200
    for page in protected:
        assert request(base, f"/{page}.html", jar=jar)[0] == 200

    status, body, _ = request(base, "/api/questao", jar=jar)
    assert status == 200
    question_id = json.loads(body)["id"]
    status, body, _ = request(base, "/api/responder", {"questao_id": question_id, "resposta": -999}, jar)
    assert status == 200 and json.loads(body)["correta"] is False
    status, body, _ = request(base, "/api/progresso", jar=jar)
    assert status == 200 and json.loads(body)["erros"] == 1
    assert request(base, "/api/conquistas", jar=jar)[0] == 200

    assert request(base, "/api/logout", {}, jar, {"Origin": "https://wrong.example"})[0] == 403
    assert request(base, "/api/eu", jar=jar)[0] == 200
    assert request(base, "/api/logout", {}, jar)[0] == 204
    assert request(base, "/api/eu", jar=jar)[0] == 401
    assert request(base, "/api/eu", headers={"Cookie": f"token={old_token}"})[0] == 401
    assert request(base, "/dashboard.html", jar=jar)[0] == 401

    # Old accounts are still allowed to log in with a shorter stored password.
    old_hash = bcrypt.hashpw(b"1234", bcrypt.gensalt()).decode()
    with sqlite3.connect(work / "matematica.db") as db:
        db.execute("INSERT INTO usuarios (nome, senha_hash) VALUES (?, ?)", ("ContaAntiga", old_hash))
    old_jar = http.cookiejar.CookieJar()
    assert request(base, "/api/login", {"nome": "ContaAntiga", "senha": "1234"}, old_jar)[0] == 200
    with sqlite3.connect(work / "matematica.db") as db:
        db.execute("UPDATE sessoes_login SET criada_em = ? WHERE usuario_id = (SELECT id FROM usuarios WHERE nome = ?)", ("2000-01-01 00:00:00", "ContaAntiga"))
    assert request(base, "/api/eu", jar=old_jar)[0] == 401
    status, body, _ = request(base, "/dashboard.html", jar=old_jar, headers={"Accept": "text/html"})
    assert status == 200 and b"access-form" in body
