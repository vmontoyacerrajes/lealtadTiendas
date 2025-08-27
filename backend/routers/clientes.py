# routers/clientes.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from pydantic import EmailStr

from db.database import get_db
from schemas.clientes import ClienteCreate, ClienteOut
from services.clientes_service import (
    crear_cliente as svc_crear_cliente,
    listar_clientes as svc_listar_clientes,
    obtener_cliente as svc_obtener_cliente,
    eliminar_cliente as svc_eliminar_cliente,
    obtener_por_correo as svc_obtener_por_correo,
)

router = APIRouter(prefix="/clientes", tags=["Clientes"])

@router.post("/", response_model=ClienteOut)
def crear_cliente(payload: ClienteCreate, db: Session = Depends(get_db)):
    return svc_crear_cliente(db, payload)

@router.get("/", response_model=List[ClienteOut])
def obtener_clientes(db: Session = Depends(get_db)):
    return svc_listar_clientes(db)

# Colocar antes de "/{cliente_id}" para evitar ambigüedad
@router.get("/by-correo", response_model=ClienteOut)
def obtener_cliente_por_correo(
    correo: EmailStr = Query(..., description="Correo del cliente"),
    db: Session = Depends(get_db),
):
    # El service ya lanza 404 si no encuentra
    return svc_obtener_por_correo(db, correo)

@router.get("/{cliente_id}", response_model=ClienteOut)
def obtener_cliente(cliente_id: int, db: Session = Depends(get_db)):
    return svc_obtener_cliente(db, cliente_id)

@router.delete("/{cliente_id}", response_model=ClienteOut)
def eliminar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    return svc_eliminar_cliente(db, cliente_id)