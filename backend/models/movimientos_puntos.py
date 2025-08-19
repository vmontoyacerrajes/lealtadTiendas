# models/movimientos_puntos.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db.database import Base

class MovimientoPuntos(Base):
    __tablename__ = "movimientos_puntos"

    id = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"), nullable=False)
    tipo = Column(String(20), nullable=False)  # "acumulado" | "canjeado"
    puntos = Column(Integer, nullable=False)
    descripcion = Column(String(255))
    referencia = Column(String(64), nullable=True, index=True)  # ← **importante**# p.ej. folio de ticket/factura
    fecha = Column(DateTime(timezone=True), server_default=func.now())

    # Bloquea el mismo ticket por cliente (opcional pero recomendado)
    __table_args__ = (
        # Evita duplicar ticket por cliente
        UniqueConstraint("id_cliente", "referencia", name="uq_mov_ref_cliente"),
        # Acelera consultas por cliente/fecha
        Index("ix_mov_idcliente_fecha", "id_cliente", "fecha"),
    )

    # relación inversa
    cliente = relationship("Cliente", back_populates="movimientos")