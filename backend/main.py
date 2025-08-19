# main.py
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from db.database import get_db
from routers import clientes, movimientos, auth
from routers import caja  # <-- NUEVO
from utils.logging_conf import setup_logging
import logging

# 1) Logging
setup_logging()
logger = logging.getLogger("lealtad")

# 2) App
app = FastAPI(title="Sistema de Lealtad Tiendascerrajes")

# 3) (Opcional) CORS para pruebas
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Ajusta en producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4) Healthcheck
@app.get("/healthz")
def healthz(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "db": "ok"}
    except Exception:
        raise HTTPException(status_code=500, detail="db_error")

# 5) Raíz simple (útil en pruebas)
@app.get("/")
def root():
    return {"status": "ok"}

# 6) Routers (cada uno ya trae su prefix)
app.include_router(clientes.router)
app.include_router(movimientos.router)
app.include_router(auth.router)
app.include_router(caja.router)  # <-- NUEVO

# 7) Manejador global de excepciones (después de definir app)
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(content={"detail": "internal_server_error"}, status_code=500)