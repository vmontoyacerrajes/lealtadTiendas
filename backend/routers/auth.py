# routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from db.database import get_moving_db
from services.auth_service import authenticate_caja_user, build_token_claims_for_caja
from utils.token import create_access_token, decode_access_token, oauth2_scheme


router = APIRouter(tags=["Autenticación"])


class LoginJSON(BaseModel):
    username: str
    password: str
    origin: Optional[str] = "caja"  # por ahora solo "caja"


@router.post("/login")
async def login(
    request: Request,
    db_moving: Session = Depends(get_moving_db),
):
    """
    Soporta:
    - JSON: { "username": "...", "password": "...", "origin": "caja" }
    - form-data (OAuth2): username, password
    """
    username: Optional[str] = None
    password: Optional[str] = None
    origin = "caja"

    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        body = await request.json()
        username = (body or {}).get("username")
        password = (body or {}).get("password")
        origin = (body or {}).get("origin", "caja")
    else:
        form = await request.form()
        username = form.get("username")
        password = form.get("password")
        # origin por defecto "caja"

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="username y password son requeridos.",
        )

    if origin != "caja":
        # Aquí más adelante podrás soportar "app" (usuarios propios de lealtad)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Origen no soportado aún.",
        )

    # Autenticación contra base Moving (usuarios de caja)
    user = authenticate_caja_user(db_moving, username, password)
    claims = build_token_claims_for_caja(user)
    token = create_access_token(claims)

    return {"access_token": token, "token_type": "bearer"}


@router.get("/perfil")
def perfil(token: str = Depends(oauth2_scheme)):
    """
    Devuelve los claims esenciales del token.
    Útil para que la app obtenga `uid` y `origin`.
    """
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado.",
        )

    return {
        "usuario": payload.get("sub"),
        "uid": payload.get("uid"),
        "origin": payload.get("origin"),
        "role": payload.get("role"),
    }