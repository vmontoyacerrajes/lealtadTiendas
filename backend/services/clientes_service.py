# services/clientes_service.py
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
import hashlib

from models.clientes import Cliente
from schemas.clientes import ClienteCreate

# --- normalización / helpers ---
def _norm_email(correo: str) -> str:
    return (correo or "").strip().lower()

def _hash_password(plain: str) -> str:
    return hashlib.sha256(plain.encode("utf-8")).hexdigest()

def verificar_password(plain: str, hashed: Optional[str]) -> bool:
    if not hashed:
        return False
    return _hash_password(plain) == hashed

# --- CRUD básicos ---
def crear_cliente(db: Session, payload: ClienteCreate) -> Cliente:
    obj = Cliente(
        nombre=payload.nombre,
        correo=_norm_email(payload.correo),
        telefono=payload.telefono,
        codigo_sap=payload.codigo_sap,
    )
    try:
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Correo o código SAP ya registrado.",
        )

def listar_clientes(db: Session) -> List[Cliente]:
    return db.query(Cliente).all()

def obtener_cliente(db: Session, cliente_id: int) -> Cliente:
    obj = db.query(Cliente).filter(Cliente.id_cliente == cliente_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return obj

def eliminar_cliente(db: Session, cliente_id: int) -> Cliente:
    obj = db.query(Cliente).filter(Cliente.id_cliente == cliente_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    db.delete(obj)
    db.commit()
    return obj

def obtener_por_correo(db: Session, correo: str) -> Optional[Cliente]:
    return db.query(Cliente).filter(Cliente.correo == _norm_email(correo)).first()

# --- password & login para la app móvil ---
def set_password_cliente(db: Session, correo: str, password: str) -> Cliente:
    correo_n = _norm_email(correo)
    cli = obtener_por_correo(db, correo_n)
    if not cli:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    if not password or len(password.strip()) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres.")

    cli.password_hash = _hash_password(password.strip())
    try:
        db.add(cli)
        db.commit()
        db.refresh(cli)
        return cli
    except Exception:
        db.rollback()
        raise

def autenticar_cliente(db: Session, correo: str, password: str) -> Optional[Cliente]:
    correo_n = _norm_email(correo)
    cli = obtener_por_correo(db, correo_n)
    if not cli:
        return None
    if not verificar_password(password.strip(), getattr(cli, "password_hash", None)):
        return None
    return cli

def get_or_create_cliente(
    db: Session,
    *,
    correo: str,
    nombre: Optional[str] = None,
    telefono: Optional[str] = None,
    codigo_sap: Optional[str] = None,
) -> Tuple[Cliente, bool]:
    """
    Devuelve (cliente, creado_bool)
    """
    correo_n = _norm_email(correo)
    existing = obtener_por_correo(db, correo_n)
    if existing:
        return existing, False

    nuevo = Cliente(
        nombre=(nombre or correo_n.split("@")[0]).strip(),
        correo=correo_n,
        telefono=telefono.strip() if isinstance(telefono, str) else telefono,
        codigo_sap=codigo_sap,
    )
    try:
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo, True
    except IntegrityError:
        db.rollback()
        existing = obtener_por_correo(db, correo_n)
        if existing:
            return existing, False
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo crear el cliente (posible duplicado de correo/código SAP).",
        )