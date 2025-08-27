# routers/app_mobile.py
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from db.database import get_db
from services.clientes_service import (
    get_or_create_cliente,
    set_password_cliente,
    autenticar_cliente,
)
from schemas.clientes import ClienteOut

router = APIRouter(prefix="/app", tags=["App Móvil"])

# ---- DTOs ----
class IdentifyRequest(BaseModel):
    correo: EmailStr
    nombre: str | None = None
    telefono: str | None = None

class SetPasswordRequest(BaseModel):
    correo: EmailStr
    password: str = Field(min_length=6)

class LoginRequest(BaseModel):
    correo: EmailStr
    password: str

# ---- Endpoints ----
@router.post("/identify", response_model=ClienteOut)
def identify(req: IdentifyRequest, db: Session = Depends(get_db)):
    cliente, _ = get_or_create_cliente(
        db,
        correo=req.correo,
        nombre=req.nombre,
        telefono=req.telefono,
    )
    return cliente

@router.post("/set-password")
def set_password(req: SetPasswordRequest, db: Session = Depends(get_db)):
    set_password_cliente(db, req.correo, req.password)
    return {"ok": True}

@router.post("/login", response_model=ClienteOut)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    cli = autenticar_cliente(db, req.correo, req.password)
    if not cli:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Correo o contraseña inválidos.")
    return cli