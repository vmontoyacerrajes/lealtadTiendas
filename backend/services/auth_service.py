# services/auth_service.py
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
import hashlib

from db.database import get_moving_db  # si lo usas en routers
from models.moving_user import MovingUser  # tu modelo de Moving

def authenticate_caja_user(db_moving: Session, username: str, password: str) -> MovingUser:
    if not username or not password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Faltan credenciales")

    username_norm = username.strip().upper()

    # Busca por USER normalizado y activo=1
    user: MovingUser | None = (
        db_moving.query(MovingUser)
        .filter(
            func.upper(MovingUser.user) == username_norm,
            MovingUser.activo == 1
        )
        .first()
    )
    if not user:
        # Usuario no existe o inactivo
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

    # Calcula SHA-1 del password ingresado
    sha1_hex = hashlib.sha1(password.encode("utf-8")).hexdigest()  # minúsculas

    # Compara case-insensitive por seguridad (DB puede tener mayúsculas)
    if (user.pass_hash or "").strip().lower() != sha1_hex.lower():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

    return user


def build_token_claims_for_caja(user: MovingUser) -> dict:
    # nombre completo desde nombre + paterno + materno (si existen)
    nombre_parts = [p for p in [user.nombre, user.paterno, user.materno] if p]
    full_name = " ".join(nombre_parts)

    # mapea tipo -> role si lo necesitas
    role = (user.tipo or "").lower()  # ej: "cajero", "admin", etc.

    return {
        "sub": user.user,               # usuario
        "uid": user.id_usuario,         # id en Moving
        "origin": "caja",
        "role": role,
        "name": full_name,
        "sucursal": user.id_sucursal,
    }