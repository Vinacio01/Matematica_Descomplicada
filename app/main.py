from fastapi import FastAPI

from app import models
from app.database import Base, engine
from app.routers import auth, jogo


Base.metadata.create_all(bind=engine)


app = FastAPI(title="Matemática Descomplicada")


app.include_router(auth.router)
app.include_router(jogo.router)


@app.get("/")
def inicio():
    return {"mensagem": "Pagina Inicial"}
