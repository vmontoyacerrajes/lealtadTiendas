from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta

from db import get_db
from models import MovimientoPuntos, TipoMovimiento
from schemas import MovimientoPuntosCreate, MovimientoOut

router = APIRouter()

@router.post("/acumular")
def acumular_puntos(data: MovimientoPuntosCreate, db: Session = Depends(get_db)):
    nuevo = MovimientoPuntos(**data.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"mensaje": "Puntos acumulados", "id": nuevo.id}

@router.post("/canjear")
def canjear_puntos(data: MovimientoPuntosCreate, db: Session = Depends(get_db)):
    hoy = date.today()

    acumulados = db.query(func.sum(MovimientoPuntos.puntos))\
        .filter(MovimientoPuntos.id_cliente == data.id_cliente)\
        .filter(MovimientoPuntos.tipo == TipoMovimiento.ACUMULACION)\
        .filter(MovimientoPuntos.fecha_vencimiento >= hoy)\
        .scalar() or 0

    canjeados = db.query(func.sum(MovimientoPuntos.puntos))\
        .filter(MovimientoPuntos.id_cliente == data.id_cliente)\
        .filter(MovimientoPuntos.tipo == TipoMovimiento.CANJE)\
        .scalar() or 0

    disponibles = acumulados - canjeados

    if data.puntos > disponibles:
        raise HTTPException(status_code=400, detail="No tienes puntos suficientes para este canje")

    nuevo = MovimientoPuntos(**data.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"mensaje": "Puntos canjeados", "id": nuevo.id}

@router.get("/saldo/{id_cliente}")
def obtener_saldo(id_cliente: int, db: Session = Depends(get_db)):
    hoy = date.today()

    acumulados = db.query(func.sum(MovimientoPuntos.puntos))\
        .filter(MovimientoPuntos.id_cliente == id_cliente)\
        .filter(MovimientoPuntos.tipo == TipoMovimiento.ACUMULACION)\
        .filter(MovimientoPuntos.fecha_vencimiento >= hoy)\
        .scalar() or 0

    canjeados = db.query(func.sum(MovimientoPuntos.puntos))\
        .filter(MovimientoPuntos.id_cliente == id_cliente)\
        .filter(MovimientoPuntos.tipo == TipoMovimiento.CANJE)\
        .scalar() or 0

    disponibles = round(acumulados - canjeados, 2)
    if disponibles < 0:
        disponibles = 0

    return {
        "id_cliente": id_cliente,
        "puntos_disponibles": disponibles,
        "puntos_acumulados": float(acumulados),
        "puntos_canjeados": float(canjeados)
    }

@router.get("/historial/{id_cliente}", response_model=list[MovimientoOut])
def historial_puntos(id_cliente: int, db: Session = Depends(get_db)):
    movimientos = db.query(MovimientoPuntos).\
        filter(MovimientoPuntos.id_cliente == id_cliente).\
        order_by(MovimientoPuntos.fecha.desc()).all()
    return movimientos

@router.post("/acumular/desde-caja")
def acumular_desde_caja(id_cliente: int, monto_compra: float, referencia: str, db: Session = Depends(get_db)):
    puntos = round(monto_compra * 0.01, 2)
    vencimiento = date.today() + timedelta(days=365)

    nuevo = MovimientoPuntos(
        id_cliente=id_cliente,
        tipo=TipoMovimiento.ACUMULACION,
        puntos=puntos,
        referencia=referencia,
        fecha_vencimiento=vencimiento
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return {
        "mensaje": f"{puntos} puntos acumulados por compra de ${monto_compra}",
        "id_movimiento": nuevo.id
    }