from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

import os
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from db.database import get_db
from models.clientes import Cliente

# =========================
# Configuración del JWT
# =========================
SECRET_KEY = os.getenv("SECRET_KEY", "clave_super_secreta_para_jwt")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# Usa ruta absoluta para evitar 422 con OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


# =========================
# Core JWT
# =========================
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un JWT con 'exp'. Espera que 'data' incluya al menos:
      - sub: identificador principal (usuario o email)
      - origin: "caja" | "app"
    """
    to_encode = data.copy()
    expire = datetime.now(tz=timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Devuelve los claims o None si el token no es válido.
    """
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


# =========================
# Dependencias de seguridad
# =========================
def get_token_payload(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Decodifica y valida el token. Lanza 401 si es inválido/expirado.
    """
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def get_current_caja_claims(payload: Dict[str, Any] = Depends(get_token_payload)) -> Dict[str, Any]:
    """
    Valida que el token sea de origen 'caja' y devuelve sus claims.
    Útil para endpoints operados por usuarios de caja (Moving).
    """
    if payload.get("origin") != "caja":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere token de caja.",
        )
    return payload


def get_current_cliente(
    payload: Dict[str, Any] = Depends(get_token_payload),
    db: Session = Depends(get_db),
) -> Cliente:
    """
    Valida que el token sea de origen 'app' y devuelve el Cliente.
    - Busca el e-mail en 'email' o en 'sub' (compatibilidad).
    """
    if payload.get("origin") != "app":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere token de app (cliente).",
        )

    email = payload.get("email") or payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sin identidad de cliente.",
        )

    cliente = db.query(Cliente).filter(Cliente.correo == email).first()
    if cliente is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cliente no encontrado para este token.",
        )
    return cliente


# =========================
# Alias (compatibilidad con tu código actual)
# =========================
def crear_token_acceso(data: dict) -> str:
    """Alias en español para no romper imports existentes."""
    return create_access_token(data)


def obtener_cliente_actual(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Cliente:
    """
    Alias del flujo 'app'. Si recibiera un token de caja, fallará con 403.
    """
    payload = get_token_payload(token)  # valida y decodifica
    # Simula el comportamiento anterior pero con validación de origin
    return get_current_cliente(payload=payload, db=db)