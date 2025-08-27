# schemas/clientes.py
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, constr, ConfigDict

# -------------------------
# Esquemas de ENTRADA (requests)
# -------------------------

class ClienteCreate(BaseModel):
    nombre: str
    correo: EmailStr
    telefono: Optional[str] = None
    codigo_sap: Optional[str] = None
    # contraseña en ALTA (se hashea en el servicio)
    password: constr(min_length=6)

class ClienteUpdatePasswordIn(BaseModel):
    password: constr(min_length=6)

class ClienteLoginIn(BaseModel):
    correo: EmailStr
    password: str

# -------------------------
# Esquemas de SALIDA (responses)
# -------------------------

class ClienteBaseOut(BaseModel):
    # Pydantic v2: habilita mapeo desde ORM
    model_config = ConfigDict(from_attributes=True)

    id_cliente: int
    nombre: str
    correo: EmailStr
    telefono: Optional[str] = None
    codigo_sap: Optional[str] = None
    fecha_registro: Optional[datetime] = None

# Alias para usar en routers
ClienteOut = ClienteBaseOut