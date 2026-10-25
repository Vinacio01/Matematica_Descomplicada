from pathlib import Path
import hmac
import os

from fastapi import Cookie, Depends, FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app import models
from app.database import Base, engine, get_db
from app.dependencias import usuario_logado
from app.routers import auth, jogo
from app.seguranca import gerar_token_csrf


STATIC_DIR = Path(__file__).resolve().parent / "static"
PROTECTED_PAGES = (
    "dashboard.html", "game-modes.html", "exercises.html",
    "progress.html", "achievements.html", "game-result.html",
)

Base.metadata.create_all(bind=engine)


app = FastAPI(title="Matemática Descomplicada")


app.include_router(auth.router)
app.include_router(jogo.router)
app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")


@app.middleware("http")
async def verificar_origem(request: Request, call_next):
    if request.method not in {"GET", "HEAD", "OPTIONS"} and request.cookies.get("token"):
        origin = request.headers.get("origin")
        referer = request.headers.get("referer")
        expected = os.getenv("APP_PUBLIC_ORIGIN", str(request.base_url)).rstrip("/")
        if (origin and origin != expected) or (not origin and referer and not referer.startswith(expected + "/")):
            return JSONResponse({"detail": "Origem não permitida"}, status_code=403,
                                headers={"Cache-Control": "no-store"})
        if request.url.path not in {"/api/cadastro", "/api/login"}:
            enviado = request.headers.get("x-csrf-token", "")
            esperado = gerar_token_csrf(request.cookies["token"])
            if not hmac.compare_digest(enviado, esperado):
                return JSONResponse({"detail": "Proteção de sessão inválida"}, status_code=403,
                                    headers={"Cache-Control": "no-store"})
    response = await call_next(request)
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response


def protected_page(filename: str):
    def serve(
        request: Request,
        token: str | None = Cookie(default=None),
        db: Session = Depends(get_db),
    ):
        try:
            usuario_logado(token=token, db=db)
        except HTTPException as error:
            if error.status_code == 401 and "text/html" in request.headers.get("accept", ""):
                return RedirectResponse("/access.html", status_code=303)
            raise
        return FileResponse(STATIC_DIR / filename, headers={"Cache-Control": "no-store"})
    return serve


for page in PROTECTED_PAGES:
    app.add_api_route(
        f"/{page}", protected_page(page), methods=["GET"],
        include_in_schema=False,
    )


@app.get("/", include_in_schema=False)
def inicio():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/{filename}", include_in_schema=False)
def arquivo_publico(filename: str):
    if Path(filename).name != filename or filename in {".", ".."}:
        raise HTTPException(status_code=404)
    if filename not in {"index.html", "access.html"} and Path(filename).suffix not in {".css", ".js"}:
        raise HTTPException(status_code=404)
    caminho = STATIC_DIR / filename
    if not caminho.is_file():
        raise HTTPException(status_code=404)
    return FileResponse(caminho)
