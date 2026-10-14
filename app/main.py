from fastapi import FastAPI
from app.database import Base, engine
from app import models
from app.routers import auth

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Matemática Descomplicada")

app.include_router(auth.router)

@app.get("/")
def inicio():
    return {"mensagem":"Pagina Inicial"}
