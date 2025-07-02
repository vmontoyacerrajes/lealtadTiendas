# auth.py

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
from models import Usuario
from db import get_moving_db

# Configuración JWT
SECRET_KEY = "supersecreto123"  # ⚠️ cambiar por variable de entorno en producción
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def verificar_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def autenticar_usuario(db: Session, username: str, password: str):
    usuario = db.query(Usuario).filter(Usuario.user == username).first()
    if not usuario or not usuario.activo:
        return None
    if not verificar_password(password, usuario.pass_field):
        return None
    return usuario

def crear_token_acceso(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_moving_db)):
    cred_ex = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise cred_ex
    except JWTError:
        raise cred_ex

    user = db.query(Usuario).filter(Usuario.user == username).first()
    if user is None or not user.activo:
        raise cred_ex
    return user