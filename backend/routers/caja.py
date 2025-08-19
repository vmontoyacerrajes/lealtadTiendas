# routers/caja.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from db.database import get_db
from services.movimientos_service import acumular_puntos
from schemas.movimientos_puntos import MovimientoPuntosOut, AcumularRequest

router = APIRouter(
    prefix="/caja",
    tags=["Caja / Escaneo"]
)

# Para el MVP asumimos QR con formato: "CLI:<id_cliente>"
# Ej: "CLI:123"
def parse_qr_payload(qr_data: str) -> int:
    prefix = "CLI:"
    if not qr_data or not qr_data.startswith(prefix):
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


class AcumularQRRequest(BaseModel):
    qr_data: str = Field(min_length=5)
    puntos: int = Field(gt=0)
    descripcion: str | None = None
    # Folio/ticket único para bloquear doble acumulación por ticket
    referencia: str = Field(min_length=1, max_length=64)


@router.post("/acumular-qr", response_model=MovimientoPuntosOut, status_code=status.HTTP_201_CREATED)
def acumular_por_qr(payload: AcumularQRRequest, db: Session = Depends(get_db)):
    """
    Acumula puntos usando un QR (CLI:<id_cliente>).
    Aplica validación anti-doble-captura por 'referencia'.
    """
    id_cliente = parse_qr_payload(payload.qr_data)

    # Construimos el esquema esperado por el service
    req = AcumularRequest(
        id_cliente=id_cliente,
        puntos=payload.puntos,
        descripcion=payload.descripcion,
        referencia=payload.referencia,
    )

    mov = acumular_puntos(db, req)
    return mov


class ResolverQRResponse(BaseModel):
    id_cliente: int


@router.get("/resolver-qr", response_model=ResolverQRResponse)
def resolver_qr(qr_data: str):
    """
    Devuelve el id_cliente a partir del QR. Útil si tu front de caja
    prefiere resolver primero y luego llamar a /movimientos.
    """
    id_cliente = parse_qr_payload(qr_data)
    return ResolverQRResponse(id_cliente=id_cliente)