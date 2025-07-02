from fastapi import FastAPI
from routers import clientes, puntos
from routers import auth

app = FastAPI(title="Sistema de Lealtad Tiendascerrajes")

app.include_router(clientes.router, prefix="/clientes", tags=["Clientes"])
app.include_router(puntos.router, prefix="/puntos", tags=["Puntos"])

app.include_router(auth.router, tags=["Autenticación"])