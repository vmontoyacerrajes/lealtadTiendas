# models/clientes.py
from typing import Optional

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

# 👇 CORRECTO: Base se importa de db.database
from db.database import Base


class Cliente(Base):
    __tablename__ = "clientes"

    id_cliente = Column(Integer, primary_key=True, index=True)

    nombre = Column(String(120), nullable=False)
    correo = Column(String(255), unique=True, index=True, nullable=False)
    telefono: Optional[str] = Column(String(20), nullable=True)
    codigo_sap: Optional[str] = Column(String(50), unique=True, nullable=True)

    # Para login en app móvil
    password_hash: Optional[str] = Column(String(128), nullable=True)

    fecha_registro = Column(DateTime, server_default=func.now(), nullable=False)

    # Relación inversa con movimientos_puntos
    movimientos = relationship(
        "MovimientoPuntos",
        back_populates="cliente",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<Cliente id={self.id_cliente} correo={self.correo!r} nombre={self.nombre!r}>"