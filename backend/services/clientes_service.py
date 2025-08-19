# services/clientes_service.py
from typing import List
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from models.clientes import Cliente
from schemas.clientes import ClienteCreate

def crear_cliente(db: Session, payload: ClienteCreate) -> Cliente:
    nuevo = Cliente(**payload.model_dump())
    try:
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Correo o código SAP ya registrado.")

def listar_clientes(db: Session) -> List[Cliente]:
    return db.query(Cliente).all()

def obtener_cliente(db: Session, cliente_id: int) -> Cliente:
    cli = db.query(Cliente).filter(Cliente.id_cliente == cliente_id).first()
    if not cli:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cli

def eliminar_cliente(db: Session, cliente_id: int) -> Cliente:
    cli = obtener_cliente(db, cliente_id)
    db.delete(cli)
    db.commit()
    return cli