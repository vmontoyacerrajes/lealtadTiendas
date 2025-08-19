from sqlalchemy.orm import Session
from db.database import SessionLocal
from models import Cliente

def insertar_cliente_dummy():
    db: Session = SessionLocal()
    cliente = Cliente(
        nombre="Cliente Prueba",
        correo="cliente@demo.com",
        telefono="5551234567",
        codigo_sap="CLT-TEST-001"
    )

    # Verificar si ya existe
    existente = db.query(Cliente).filter(Cliente.correo == cliente.correo).first()
    if existente:
        print("⚠️ Cliente ya existe, omitiendo inserción.")
    else:
        db.add(cliente)
        db.commit()
        db.refresh(cliente)
        print("✅ Cliente insertado:", cliente)

    db.close()

if __name__ == "__main__":
    insertar_cliente_dummy()