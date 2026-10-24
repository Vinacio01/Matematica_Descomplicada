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


def request(base, path, payload=None, jar=None, headers=None, method=None):
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar if jar is not None else http.cookiejar.CookieJar()))
    method = method or ("POST" if payload is not None else "GET")
    body = json.dumps(payload).encode() if payload is not None else (b"" if method == "POST" else None)
    req = urllib.request.Request(
        base + path, data=body,
        headers={"Content-Type": "application/json", **(headers or {})},
        method=method,
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

    assert json.loads(request(base, "/api/progresso", jar=jar)[1])["acertos"] == 0
    with sqlite3.connect(work / "matematica.db") as db:
        assert db.execute("SELECT COUNT(*) FROM progressos").fetchone()[0] == 0
    assert request(base, "/api/questao", jar=jar)[0] == 404
    with sqlite3.connect(work / "matematica.db") as db:
        assert db.execute("SELECT COUNT(*) FROM questoes").fetchone()[0] == 0
    status, body, _ = request(base, "/api/csrf", jar=jar)
    assert status == 200
    csrf = json.loads(body)["csrf_token"]
    csrf_header = {"X-CSRF-Token": csrf}
    assert request(base, "/api/questao", jar=jar, method="POST")[0] == 403
    status, body, _ = request(base, "/api/questao?formato=alternativas", jar=jar, headers=csrf_header, method="POST")
    assert status == 200
    question_id = json.loads(body)["id"]
    options = json.loads(body)["alternativas"]
    assert len(options) == len(set(options)) == 4
    assert "resposta_certa" not in json.loads(body)
    assert json.loads(request(base, "/api/questao?formato=alternativas", jar=jar)[1])["id"] == question_id
    assert json.loads(request(base, "/api/questao", jar=jar, headers=csrf_header, method="POST")[1])["id"] == question_id
    status, body, _ = request(base, "/api/responder", {"questao_id": question_id, "resposta": -999}, jar, csrf_header)
    assert status == 200 and json.loads(body)["correta"] is False
    status, body, _ = request(base, "/api/responder", {"questao_id": question_id, "resposta": -999}, jar, csrf_header)
    assert status == 200 and json.loads(body)["correta"] is False
    assert request(base, "/api/responder", {"questao_id": question_id, "resposta": 0}, jar, csrf_header)[0] == 409
    status, body, _ = request(base, "/api/progresso", jar=jar)
    assert status == 200 and json.loads(body)["erros"] == 1
    assert request(base, "/api/conquistas", jar=jar)[0] == 200

    status, body, _ = request(base, "/api/questao", jar=jar, headers=csrf_header, method="POST")
    assert status == 200 and json.loads(body)["alternativas"] is None
    typed_question = json.loads(body)
    first, operator, second = typed_question["enunciado"].split()
    a, b = int(first), int(second)
    answer = {"+": lambda: a + b, "-": lambda: a - b, "×": lambda: a * b, "÷": lambda: a // b}[operator]()
    status, body, _ = request(base, "/api/responder", {"questao_id": typed_question["id"], "resposta": answer}, jar, csrf_header)
    assert status == 200 and json.loads(body)["correta"] is True
    assert json.loads(request(base, "/api/progresso", jar=jar)[1])["acertos"] == 1

    other_jar = http.cookiejar.CookieJar()
    assert request(base, "/api/login", {"nome": "LimiteSenha", "senha": "á" * 36}, other_jar)[0] == 200
    other_csrf = json.loads(request(base, "/api/csrf", jar=other_jar)[1])["csrf_token"]
    assert request(base, "/api/responder", {"questao_id": typed_question["id"], "resposta": answer}, other_jar, {"X-CSRF-Token": other_csrf})[0] == 404

    assert request(base, "/api/logout", {}, jar, {"Origin": "https://wrong.example"})[0] == 403
    assert request(base, "/api/eu", jar=jar)[0] == 200
    assert request(base, "/api/logout", {}, jar)[0] == 403
    assert request(base, "/api/logout", {}, jar, csrf_header)[0] == 204
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


def test_ten_questions_free_training_and_user_isolation(server):
    base, work = server
    assert request(base, "/api/cadastro", {"nome": "PartidaCompleta", "senha": "senha123"})[0] == 201
    jar = http.cookiejar.CookieJar()
    assert request(base, "/api/login", {"nome": "PartidaCompleta", "senha": "senha123"}, jar)[0] == 200
    csrf = json.loads(request(base, "/api/csrf", jar=jar)[1])["csrf_token"]
    headers = {"X-CSRF-Token": csrf}

    for number in range(1, 11):
        format = "alternativas" if number % 2 else "digitada"
        status, body, _ = request(base, f"/api/questao?formato={format}", jar=jar, headers=headers, method="POST")
        assert status == 200
        question = json.loads(body)
        first, operator, second = question["enunciado"].split()
        a, b = int(first), int(second)
        correct_answer = {"+": lambda: a + b, "-": lambda: a - b, "×": lambda: a * b, "÷": lambda: a // b}[operator]()
        if format == "alternativas":
            assert len(question["alternativas"]) == 4
            assert correct_answer in question["alternativas"]
        else:
            assert question["alternativas"] is None
        answer = correct_answer if number <= 7 else -999
        payload = {"questao_id": question["id"], "resposta": answer}
        status, body, _ = request(base, "/api/responder", payload, jar, headers)
        assert status == 200 and json.loads(body)["correta"] is (number <= 7)
        assert request(base, "/api/responder", payload, jar, headers)[0] == 200
        assert request(base, "/api/questao", jar=jar)[0] == 404

    progress = json.loads(request(base, "/api/progresso", jar=jar)[1])
    assert (progress["acertos"], progress["erros"], progress["recorde"]) == (7, 3, 7)
    with sqlite3.connect(work / "matematica.db") as db:
        assert db.execute("SELECT COUNT(*) FROM respostas_questao WHERE questao_id IN (SELECT id FROM questoes WHERE usuario_id = (SELECT id FROM usuarios WHERE nome = ?))", ("PartidaCompleta",)).fetchone()[0] == 10

    assert request(base, "/api/cadastro", {"nome": "OutroJogador", "senha": "senha456"})[0] == 201
    other_jar = http.cookiejar.CookieJar()
    assert request(base, "/api/login", {"nome": "OutroJogador", "senha": "senha456"}, other_jar)[0] == 200
    other_csrf = json.loads(request(base, "/api/csrf", jar=other_jar)[1])["csrf_token"]
    assert request(base, "/api/responder", payload, other_jar, {"X-CSRF-Token": other_csrf})[0] == 404
    assert json.loads(request(base, "/api/progresso", jar=other_jar)[1])["acertos"] == 0

    status, body, _ = request(base, "/api/questao", jar=jar, headers=headers, method="POST")
    assert status == 200
    free_question = json.loads(body)
    assert free_question["id"] != question["id"]
    assert json.loads(request(base, "/api/questao", jar=jar)[1])["id"] == free_question["id"]


def test_progress_across_sessions_and_users(server):
    base, work = server
    assert request(base, "/api/cadastro", {"nome": "EvolucaoA", "senha": "senha123"})[0] == 201
    jar = http.cookiejar.CookieJar()
    assert request(base, "/api/login", {"nome": "EvolucaoA", "senha": "senha123"}, jar)[0] == 200
    csrf = json.loads(request(base, "/api/csrf", jar=jar)[1])["csrf_token"]
    headers = {"X-CSRF-Token": csrf}

    expected = {"acertos": 0, "erros": 0, "sequencia_atual": 0, "recorde": 0}
    assert json.loads(request(base, "/api/progresso", jar=jar)[1]) == expected
    with sqlite3.connect(work / "matematica.db") as db:
        assert db.execute("SELECT COUNT(*) FROM progressos WHERE usuario_id = (SELECT id FROM usuarios WHERE nome = ?)", ("EvolucaoA",)).fetchone()[0] == 0

    for number in range(1, 11):
        status, body, _ = request(base, "/api/questao", jar=jar, headers=headers, method="POST")
        assert status == 200
        question = json.loads(body)
        first, operator, second = question["enunciado"].split()
        a, b = int(first), int(second)
        correct = {"+": lambda: a + b, "-": lambda: a - b, "×": lambda: a * b, "÷": lambda: a // b}[operator]()
        answer = -999 if number in (4, 7) else correct
        assert request(base, "/api/responder", {"questao_id": question["id"], "resposta": answer}, jar, headers)[0] == 200
        progress = json.loads(request(base, "/api/progresso", jar=jar)[1])
        assert progress["acertos"] + progress["erros"] == number
        if number in (4, 7):
            assert progress["sequencia_atual"] == 0
            assert progress["recorde"] == 3
        if number == 10:
            assert progress == {"acertos": 8, "erros": 2, "sequencia_atual": 3, "recorde": 3}

    assert request(base, "/api/logout", {}, jar, headers)[0] == 204
    assert request(base, "/api/progresso", jar=jar)[0] == 401
    assert request(base, "/api/login", {"nome": "EvolucaoA", "senha": "senha123"}, jar)[0] == 200
    assert json.loads(request(base, "/api/progresso", jar=jar)[1]) == progress

    assert request(base, "/api/cadastro", {"nome": "EvolucaoB", "senha": "senha456"})[0] == 201
    other_jar = http.cookiejar.CookieJar()
    assert request(base, "/api/login", {"nome": "EvolucaoB", "senha": "senha456"}, other_jar)[0] == 200
    assert json.loads(request(base, "/api/progresso", jar=other_jar)[1]) == expected
    with sqlite3.connect(work / "matematica.db") as db:
        assert db.execute("SELECT COUNT(*) FROM progressos WHERE usuario_id = (SELECT id FROM usuarios WHERE nome = ?)", ("EvolucaoB",)).fetchone()[0] == 0
