# routers/movimientos.py
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from db.database import get_db
from schemas.movimientos_puntos import (
    MovimientoPuntosCreate,
    MovimientoPuntosOut,
    AcumularRequest,
    CanjearRequest,
)
from services.movimientos_service import (
    registrar_movimiento,
    acumular_puntos,
    canjear_puntos,
    historial_de_cliente,
    resumen_de_cliente,
)

router = APIRouter(
    prefix="/movimientos",
    tags=["Movimientos"],
)

# -----------------------------
# Schemas de respuesta
# -----------------------------
class ResumenResponse(BaseModel):
    cliente: str
    puntos_acumulados: int
    puntos_canjeados: int
    puntos_disponibles: int


# -----------------------------
# CRUD genérico (útil en Swagger)
# -----------------------------
@router.post("/", response_model=MovimientoPuntosOut, status_code=status.HTTP_201_CREATED)
def crear_movimiento(payload: MovimientoPuntosCreate, db: Session = Depends(get_db)):
    return registrar_movimiento(db, payload)


# -----------------------------
# Acciones de dominio
# -----------------------------
@router.post("/acumular", response_model=MovimientoPuntosOut, status_code=status.HTTP_201_CREATED)
def acumular(payload: AcumularRequest, db: Session = Depends(get_db)):
    """
    Acumula puntos para un cliente.
    """
    return acumular_puntos(db, payload)


@router.post("/canjear", response_model=MovimientoPuntosOut, status_code=status.HTTP_201_CREATED)
def canjear(payload: CanjearRequest, db: Session = Depends(get_db)):
    """
    Canjea puntos para un cliente (valida saldo disponible).
    """
    return canjear_puntos(db, payload)


# -----------------------------
# Consultas
# -----------------------------
@router.get("/historial/{id_cliente}", response_model=List[MovimientoPuntosOut])
@router.get("/cliente/{id_cliente}/historial", response_model=List[MovimientoPuntosOut])  # legacy
def obtener_historial(id_cliente: int, db: Session = Depends(get_db)):
    """
    Devuelve el historial de movimientos de un cliente.
    (Se exponen dos rutas por compatibilidad con el móvil legacy)
    """
    return historial_de_cliente(db, id_cliente)


@router.get("/resumen/{id_cliente}", response_model=ResumenResponse)
@router.get("/cliente/{id_cliente}/resumen", response_model=ResumenResponse)  # legacy
def obtener_resumen(id_cliente: int, db: Session = Depends(get_db)):
    """
    Devuelve el resumen de puntos del cliente:
    { cliente, puntos_acumulados, puntos_canjeados, puntos_disponibles }.
    (Se exponen dos rutas por compatibilidad con el móvil legacy)
    """
    return resumen_de_cliente(db, id_cliente)