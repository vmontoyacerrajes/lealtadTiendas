from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from db.database import Base

class Cliente(Base):
    __tablename__ = "clientes"

    id_cliente = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    correo = Column(String(100), unique=True, index=True, nullable=False)
    telefono = Column(String(20), nullable=True)
    codigo_sap = Column(String(20), unique=True, nullable=True)
    fecha_registro = Column(DateTime, server_default=func.now())

    movimientos = relationship(
        "MovimientoPuntos",
        back_populates="cliente",
        cascade="all, delete-orphan"
    )