# models/movimientos_puntos.py
from typing import Optional

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from db.database import Base


class MovimientoPuntos(Base):
    __tablename__ = "movimientos_puntos"

    id = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(
        Integer,
        ForeignKey("clientes.id_cliente", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    tipo = Column(String(20), nullable=False)  # "acumulado" | "canjeado"
    puntos = Column(Integer, nullable=False)
    descripcion: Optional[str] = Column(String(255), nullable=True)
    referencia: Optional[str] = Column(String(64), nullable=True)
    fecha = Column(DateTime, server_default=func.now(), nullable=False)

    cliente = relationship(
        "Cliente",
        back_populates="movimientos",
        lazy="joined",
    )

    __table_args__ = (
        Index("uix_mov_ref", "id_cliente", "referencia", "tipo", unique=True),
    )

    def __repr__(self) -> str:
        return (
            f"<MovimientoPuntos id={self.id} id_cliente={self.id_cliente} "
            f"tipo={self.tipo} puntos={self.puntos} ref={self.referencia!r} fecha={self.fecha}>"
        )