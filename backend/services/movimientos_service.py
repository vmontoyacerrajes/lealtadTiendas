# services/movimientos_service.py
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError, DataError

from models.movimientos_puntos import MovimientoPuntos
from models.clientes import Cliente
from schemas.movimientos_puntos import (
    MovimientoPuntosCreate, MovimientoPuntosOut,
    AcumularRequest, CanjearRequest
)

MOV_TIPOS_VALIDOS = {"acumulado", "canjeado"}
MAX_REF_LEN = 64  # debe coincidir con el tamaño de la columna en el modelo


# -----------------------------
# Utilidades internas
# -----------------------------
def _validar_cliente(db: Session, id_cliente: int) -> Cliente:
    cli = db.query(Cliente).filter(Cliente.id_cliente == id_cliente).first()
    if not cli:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
    return cli

def _norm_tipo(tipo: str) -> str:
    return (tipo or "").strip().lower()

def _validar_tipo(tipo: str) -> str:
    t = _norm_tipo(tipo)
    if t not in MOV_TIPOS_VALIDOS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tipo inválido")
    return t

def _validar_referencia(referencia: Optional[str]) -> Optional[str]:
    if referencia is None:
        return None
    ref = referencia.strip()
    if not ref:
        return None
    if len(ref) > MAX_REF_LEN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"referencia excede longitud máxima ({MAX_REF_LEN})."
        )
    return ref

def _existe_referencia(
    db: Session,
    id_cliente: int,
    referencia: Optional[str],
    tipo: Optional[str] = None
) -> bool:
    ref = _validar_referencia(referencia)
    if not ref:
        return False
    q = db.query(MovimientoPuntos).filter(
        MovimientoPuntos.id_cliente == id_cliente,
        MovimientoPuntos.referencia == ref
    )
    if tipo:
        q = q.filter(MovimientoPuntos.tipo == _norm_tipo(tipo))
    return db.query(q.exists()).scalar() is True

def _totales_cliente(db: Session, id_cliente: int) -> Dict[str, int]:
    acumulado = db.query(func.coalesce(func.sum(MovimientoPuntos.puntos), 0)).filter(
        MovimientoPuntos.id_cliente == id_cliente,
        MovimientoPuntos.tipo == "acumulado"
    ).scalar() or 0

    canjeado = db.query(func.coalesce(func.sum(MovimientoPuntos.puntos), 0)).filter(
        MovimientoPuntos.id_cliente == id_cliente,
        MovimientoPuntos.tipo == "canjeado"
    ).scalar() or 0

    return {"acumulado": acumulado, "canjeado": canjeado, "disponible": acumulado - canjeado}


# -----------------------------
# Casos de uso (API)
# -----------------------------
def registrar_movimiento(db: Session, mov: MovimientoPuntosCreate) -> MovimientoPuntos:
    _validar_cliente(db, mov.id_cliente)
    tipo = _validar_tipo(mov.tipo)
    referencia = _validar_referencia(mov.referencia)

    # Regla de duplicidad: solo bloqueamos acumulados por la misma referencia
    if tipo == "acumulado" and _existe_referencia(db, mov.id_cliente, referencia, tipo="acumulado"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este ticket ya fue acumulado para este cliente."
        )

    obj = MovimientoPuntos(
        id_cliente=mov.id_cliente,
        tipo=tipo,
        puntos=mov.puntos,
        descripcion=mov.descripcion,
        referencia=referencia
    )
    db.add(obj)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        # Por si el índice único (id_cliente, referencia, tipo) hizo su trabajo
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Movimiento duplicado (índice único)."
        )
    except DataError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Datos inválidos") from e

    db.refresh(obj)
    return obj

def acumular_puntos(db: Session, data: AcumularRequest) -> MovimientoPuntos:
    _validar_cliente(db, data.id_cliente)
    referencia = _validar_referencia(data.referencia)

    # Bloqueo de doble acumulación por referencia
    if _existe_referencia(db, data.id_cliente, referencia, tipo="acumulado"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este ticket ya fue acumulado para este cliente."
        )

    obj = MovimientoPuntos(
        id_cliente=data.id_cliente,
        tipo="acumulado",
        puntos=data.puntos,
        descripcion=data.descripcion,
        referencia=referencia
    )
    db.add(obj)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Movimiento duplicado (índice único)."
        )
    except DataError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Datos inválidos") from e

    db.refresh(obj)
    return obj

def canjear_puntos(db: Session, data: CanjearRequest) -> MovimientoPuntos:
    _validar_cliente(db, data.id_cliente)
    tot = _totales_cliente(db, data.id_cliente)
    if data.puntos > tot["disponible"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Saldo insuficiente para canje")

    referencia = _validar_referencia(data.referencia)

    obj = MovimientoPuntos(
        id_cliente=data.id_cliente,
        tipo="canjeado",
        puntos=data.puntos,
        descripcion=data.descripcion,
        referencia=referencia
    )
    db.add(obj)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        # No solemos bloquear canjes por referencia, pero si existe índice único
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Movimiento duplicado (índice único)."
        )
    except DataError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Datos inválidos") from e

    db.refresh(obj)
    return obj

def historial_de_cliente(db: Session, id_cliente: int) -> List[MovimientoPuntos]:
    _validar_cliente(db, id_cliente)
    return db.query(MovimientoPuntos).filter(
        MovimientoPuntos.id_cliente == id_cliente
    ).order_by(MovimientoPuntos.fecha.desc()).all()

def resumen_de_cliente(db: Session, id_cliente: int) -> Dict[str, Any]:
    cli = _validar_cliente(db, id_cliente)
    tot = _totales_cliente(db, id_cliente)
    return {
        "cliente": cli.nombre,
        "puntos_acumulados": tot["acumulado"],
        "puntos_canjeados": tot["canjeado"],
        "puntos_disponibles": tot["disponible"],
    }