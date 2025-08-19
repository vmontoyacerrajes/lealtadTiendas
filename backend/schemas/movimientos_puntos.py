# schemas/movimientos_puntos.py
from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, Field, ConfigDict

# Tipos permitidos para movimiento
TipoMovimiento = Literal["acumulado", "canjeado"]


class MovimientoPuntosBase(BaseModel):
    puntos: int = Field(gt=0)
    tipo: TipoMovimiento  # "acumulado" | "canjeado"
    descripcion: Optional[str] = Field(default=None, max_length=255)
    # folio/ticket único por cliente (ajusta long máx. a lo que tengas en BD)
    referencia: Optional[str] = Field(default=None, min_length=1, max_length=64)


class MovimientoPuntosCreate(MovimientoPuntosBase):
    id_cliente: int


class MovimientoPuntosUpdate(BaseModel):
    puntos: Optional[int] = Field(default=None, gt=0)
    tipo: Optional[TipoMovimiento] = None
    descripcion: Optional[str] = Field(default=None, max_length=255)
    referencia: Optional[str] = Field(default=None, min_length=1, max_length=64)


class MovimientoPuntosOut(MovimientoPuntosBase):
    id: int
    id_cliente: int
    fecha: datetime

    # Pydantic v2
    model_config = ConfigDict(from_attributes=True)


# Esquemas “amistosos” para caja
class AcumularRequest(BaseModel):
    id_cliente: int
    puntos: int = Field(gt=0)
    descripcion: Optional[str] = Field(default=None, max_length=255)
    # requerido para bloquear doble acumulación por ticket
    referencia: str = Field(min_length=1, max_length=64)


class CanjearRequest(BaseModel):
    id_cliente: int
    puntos: int = Field(gt=0)
    descripcion: Optional[str] = Field(default=None, max_length=255)
    referencia: Optional[str] = Field(default=None, min_length=1, max_length=64)