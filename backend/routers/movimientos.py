# routers/movimientos.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from db.database import get_db
from services.movimientos_service import (
    registrar_movimiento, historial_de_cliente, resumen_de_cliente,
    acumular_puntos, canjear_puntos
)
from schemas.movimientos_puntos import (
    MovimientoPuntosCreate, MovimientoPuntosOut,
    AcumularRequest, CanjearRequest
)

router = APIRouter(prefix="/movimientos", tags=["Movimientos de Puntos"])

@router.post("/", response_model=MovimientoPuntosOut)
def crear_movimiento(payload: MovimientoPuntosCreate, db: Session = Depends(get_db)):
    return registrar_movimiento(db, payload)

@router.get("/cliente/{id_cliente}", response_model=List[MovimientoPuntosOut])
def obtener_historial(id_cliente: int, db: Session = Depends(get_db)):
    return historial_de_cliente(db, id_cliente)

@router.get("/cliente/{id_cliente}/resumen", response_model=Dict[str, Any])
def obtener_resumen(id_cliente: int, db: Session = Depends(get_db)):
    return resumen_de_cliente(db, id_cliente)

# Endpoints “amistosos” para caja
@router.post("/acumular", response_model=MovimientoPuntosOut)
def acumular(payload: AcumularRequest, db: Session = Depends(get_db)):
    return acumular_puntos(db, payload)

@router.post("/canjear", response_model=MovimientoPuntosOut)
def canjear(payload: CanjearRequest, db: Session = Depends(get_db)):
    return canjear_puntos(db, payload)