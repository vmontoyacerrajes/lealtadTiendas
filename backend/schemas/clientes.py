from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from schemas.movimientos_puntos import MovimientoPuntosOut

class ClienteBase(BaseModel):
    nombre: str
    correo: EmailStr
    telefono: Optional[str] = None
    codigo_sap: Optional[str] = None

class ClienteCreate(ClienteBase):
    pass

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    codigo_sap: Optional[str] = None

class ClienteOut(ClienteBase):
    id_cliente: int
    fecha_registro: datetime
    movimientos: List[MovimientoPuntosOut] = []

    # v2
    model_config = ConfigDict(from_attributes=True)