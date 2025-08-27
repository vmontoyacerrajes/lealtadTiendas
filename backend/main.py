# main.py
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

import logging
import os

from db.database import get_db
from routers import clientes, movimientos, auth
from routers import caja
from routers import app_mobile
from utils.logging_conf import setup_logging

# 1) Logging
setup_logging()
logger = logging.getLogger("lealtad")

# 2) App
app = FastAPI(title="Sistema de Lealtad Tiendascerrajes")

# 3) CORS
raw_origins = os.getenv("CORS_ORIGINS", "")
origins = [o.strip() for o in raw_origins.split(",") if o.strip()] or [
    # DEV defaults: usa el puerto de tu CRA/Vite
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.2.90:3000",
    # si a veces usas 3001, lo dejamos también
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://192.168.2.90:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,          # usamos Bearer; si cambias a cookies, pon True
    allow_methods=["*"],
    allow_headers=["*"],              # más simple: permite todo header (incluye Authorization)
)

# 4) Healthcheck
@app.get("/healthz")
def healthz(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "db": "ok"}
    except Exception:
        raise HTTPException(status_code=500, detail="db_error")

# 5) Raíz simple
@app.get("/")
def root():
    return {"status": "ok"}

# 6) Routers
app.include_router(clientes.router)
app.include_router(movimientos.router)
app.include_router(auth.router)
app.include_router(caja.router)
app.include_router(app_mobile.router)

# 7) Error handler global
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(content={"detail": "internal_server_error"}, status_code=500)