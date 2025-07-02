from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, DECIMAL, Date, Boolean
from sqlalchemy.sql import func
from db import Base
from db import BaseMoving
import enum

class TipoMovimiento(str, enum.Enum):
    ACUMULACION = "ACUMULACION"
    CANJE = "CANJE"

class Cliente(Base):
    __tablename__ = "clientes"

    id_cliente = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100))
    correo = Column(String(100), unique=True, index=True)
    telefono = Column(String(20))
    codigo_sap = Column(String(20), unique=True)
    fecha_registro = Column(DateTime, server_default=func.now())

class MovimientoPuntos(Base):
    __tablename__ = "movimientos_puntos"

    id = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"))
    tipo = Column(Enum(TipoMovimiento))
    puntos = Column(DECIMAL(10, 2))
    fecha = Column(DateTime, server_default=func.now())
    referencia = Column(String(50))
    fecha_vencimiento = Column(Date)




class Usuario(BaseMoving):
    __tablename__ = "usuarios"

    id_usuario = Column(Integer, primary_key=True, index=True)
    user = Column(String(100), unique=True, index=True)
    pass_field = Column("pass", String(255))  # usar alias porque 'pass' es palabra reservada
    email = Column(String(100), unique=True, index=True)
    activo = Column(Boolean, default=True)
    id_sucursal = Column(Integer)
    nombre = Column(String(100))
    paterno = Column(String(100))
    materno = Column(String(100))
