# models/moving_user.py (ejemplo)
from sqlalchemy import Column, Integer, String
from db.database import BaseMoving

class MovingUser(BaseMoving):
    __tablename__ = "usuarios"  # o el que corresponda

    id_usuario = Column("Id_usuario", Integer, primary_key=True)
    user = Column("user", String(50), index=True)
    nombre = Column("nombre", String(50))
    paterno = Column("paterno", String(50))
    materno = Column("materno", String(50))
    tipo = Column("tipo", String(20))
    pass_hash = Column("pass", String(40))  # SHA-1 hex
    id_sucursal = Column("id_sucursal", String(50))
    activo = Column("activo", Integer)      # 1 = activo