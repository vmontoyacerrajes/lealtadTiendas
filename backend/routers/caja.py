# routers/caja.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, condecimal
from decimal import Decimal, ROUND_DOWN
import math
import os

from db.database import get_db
from services.movimientos_service import acumular_puntos, canjear_puntos
from services.movimientos_service import resumen_de_cliente
from schemas.movimientos_puntos import MovimientoPuntosOut, AcumularRequest, CanjearRequest

router = APIRouter(prefix="/caja", tags=["Caja / Escaneo"])

# === Helpers ===

# Para el MVP asumimos QR con formato: "CLI:<id_cliente>" (ej: CLI:123)
def parse_qr_payload(qr_data: str) -> int:
    prefix = "CLI:"
    if not qr_data or not qr_data.upper().startswith(prefix):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="QR inválido. Formato esperado 'CLI:<id_cliente>'."
        )
    try:
        return int(qr_data[len(prefix):])
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="QR inválido. id_cliente no numérico."
        )

# Valor monetario de 1 punto en la tienda (configurable por env)
# Por defecto 1 punto = $1.00
POINT_VALUE = Decimal(os.getenv("POINT_VALUE", "1.0")).quantize(Decimal("0.01"))

# === Modelos de request/response ===

class AcumularQRRequest(BaseModel):
    qr_data: str = Field(min_length=5)
    puntos: int = Field(gt=0)
    descripcion: str | None = None
    referencia: str = Field(min_length=1, max_length=64)  # ticket único

class ResolverQRResponse(BaseModel):
    id_cliente: int

class CanjearQRRequest(BaseModel):
    qr_data: str = Field(min_length=5)
    # Importe total del ticket (para no canjear más $ de los vendidos)
    importe: condecimal(gt=0, max_digits=12, decimal_places=2)
    # Si no lo mandas, el backend usará el máximo permitido por importe y saldo
    puntos: int | None = Field(default=None, ge=1)
    referencia: str | None = Field(default=None, max_length=64)
    descripcion: str | None = None

class CanjearSugerenciaResponse(BaseModel):
    id_cliente: int
    puntos_disponibles: int
    max_por_importe: int
    max_canjeable: int
    point_value: float

# === Endpoints ===

@router.post("/acumular-qr", response_model=MovimientoPuntosOut, status_code=status.HTTP_201_CREATED)
def acumular_por_qr(payload: AcumularQRRequest, db: Session = Depends(get_db)):
    """
    Acumula puntos usando un QR (CLI:<id_cliente>).
    Valida doble captura por 'referencia' (única por cliente).
    """
    id_cliente = parse_qr_payload(payload.qr_data)
    req = AcumularRequest(
        id_cliente=id_cliente,
        puntos=payload.puntos,
        descripcion=payload.descripcion,
        referencia=payload.referencia,
    )
    mov = acumular_puntos(db, req)
    return mov

@router.get("/resolver-qr", response_model=ResolverQRResponse)
def resolver_qr(qr_data: str):
    """ Devuelve el id_cliente a partir del QR. """
    return ResolverQRResponse(id_cliente=parse_qr_payload(qr_data))

@router.get("/canjear-sugerencia", response_model=CanjearSugerenciaResponse)
def canjear_sugerencia(qr_data: str, importe: float, db: Session = Depends(get_db)):
    """
    Devuelve cuánto se podría canjear como máximo dado el importe y el saldo del cliente.
    1 punto = $POINT_VALUE (configurable).
    """
    id_cliente = parse_qr_payload(qr_data)
    resumen = resumen_de_cliente(db, id_cliente)
    disponible = int(resumen["puntos_disponibles"])

    imp = Decimal(str(importe)).quantize(Decimal("0.01"))
    max_por_importe = int((imp / POINT_VALUE).to_integral_value(rounding=ROUND_DOWN))
    max_canjeable = max(0, min(disponible, max_por_importe))

    return CanjearSugerenciaResponse(
        id_cliente=id_cliente,
        puntos_disponibles=disponible,
        max_por_importe=max_por_importe,
        max_canjeable=max_canjeable,
        point_value=float(POINT_VALUE),
    )

@router.post("/canjear-qr", response_model=MovimientoPuntosOut, status_code=status.HTTP_201_CREATED)
def canjear_por_qr(payload: CanjearQRRequest, db: Session = Depends(get_db)):
    """
    Canjea puntos usando QR + importe de la venta.
    Reglas:
      - No puedes canjear más puntos que el saldo disponible del cliente.
      - No puedes canjear más puntos de los que cubre el importe (1 punto = $POINT_VALUE).
    Si 'puntos' viene vacío, aplica el máximo permitido por reglas anteriores.
    """
    id_cliente = parse_qr_payload(payload.qr_data)

    # Saldo del cliente
    resumen = resumen_de_cliente(db, id_cliente)
    disponible = int(resumen["puntos_disponibles"])

    imp = Decimal(str(payload.importe)).quantize(Decimal("0.01"))
    max_por_importe = int((imp / POINT_VALUE).to_integral_value(rounding=ROUND_DOWN))
    max_canjeable = max(0, min(disponible, max_por_importe))

    if max_canjeable <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay puntos suficientes o el importe es muy bajo para canjear."
        )

    puntos_req = payload.puntos if payload.puntos is not None else max_canjeable
    if puntos_req <= 0:
        raise HTTPException(status_code=400, detail="puntos debe ser > 0.")
    if puntos_req > max_canjeable:
        raise HTTPException(
            status_code=400,
            detail=f"Máximo canjeable: {max_canjeable} puntos (saldo: {disponible}, importe: {imp})."
        )

    req = CanjearRequest(
        id_cliente=id_cliente,
        puntos=puntos_req,
        descripcion=payload.descripcion,
        referencia=(payload.referencia or "").strip() or None,
    )
    mov = canjear_puntos(db, req)
    return mov