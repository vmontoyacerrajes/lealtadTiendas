# services/auth_service.py
from typing import Optional, Dict
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

# TODO: reemplazar por consulta real a la BD de Moving
_FAKE_CASHIERS = {
    "cajero1": {"id": 1, "usuario": "cajero1", "password": "1234", "role": "caja"},
    "cajero2": {"id": 2, "usuario": "cajero2", "password": "abcd", "role": "caja"},
}

def authenticate_caja_user(db_moving: Session, username: str, password: str) -> Dict:
    """
    Autentica contra Moving (por ahora MOCK).
    Cuando integres Moving, consulta la tabla/endpoint real aquí y valida la contraseña.
    """
    user = _FAKE_CASHIERS.get(username)
    if not user or user["password"] != password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )
    return user

def build_token_claims_for_caja(user: Dict) -> Dict:
    """
    Construye los claims del token para usuarios de caja.
    """
    return {
        "sub": user["usuario"],
        "uid": user["id"],
        "role": user.get("role", "caja"),
        "origin": "caja",
    }