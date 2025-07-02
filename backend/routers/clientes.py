from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
from models import Cliente
from schemas import ClienteCreate, ClienteOut
from auth import get_current_user
from models import Usuario

router = APIRouter()

@router.post("/registrar", response_model=ClienteOut)
def registrar_cliente(data: ClienteCreate, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.correo == data.correo).first()
    if cliente:
        raise HTTPException(status_code=400, detail="Correo ya registrado")

    nuevo_cliente = Cliente(**data.dict())
    db.add(nuevo_cliente)
    db.commit()
    db.refresh(nuevo_cliente)
    return nuevo_cliente

# routers/clientes.py (ejemplo de ruta protegida para perfil)

@router.get("/perfil", response_model=ClienteOut)
def perfil_usuario_actual(usuario: Usuario = Depends(get_current_user)):
    return {
        "id_cliente": usuario.id_usuario,
        "nombre": usuario.nombre,
        "correo": usuario.email,
        "telefono": "",  # ajustable si se usa
        "codigo_sap": ""   # no aplica en este modelo, se puede omitir
    }