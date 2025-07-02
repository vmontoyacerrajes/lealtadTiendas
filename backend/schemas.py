from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from enum import Enum

class TipoMovimiento(str, Enum):
    ACUMULACION = "ACUMULACION"
    CANJE = "CANJE"

class ClienteCreate(BaseModel):
    nombre: str
    correo: EmailStr
    telefono: str
    codigo_sap: str

class ClienteOut(BaseModel):
    id_cliente: int
    nombre: str
    correo: EmailStr
    telefono: str
    codigo_sap: str
    fecha_registro: datetime

    class Config:
        orm_mode = True

class MovimientoPuntosCreate(BaseModel):
    id_cliente: int
    tipo: TipoMovimiento
    puntos: float
    referencia: str
    fecha_vencimiento: date

class MovimientoOut(BaseModel):
    tipo: TipoMovimiento
    puntos: float
    fecha: datetime
    referencia: str
    fecha_vencimiento: date

    class Config:
        orm_mode = True