from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import declarative_base
from db.database import BaseMoving

class MovingUser(BaseMoving):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    usuario = Column(String(50), unique=True, index=True, nullable=False)
    pass_field = Column(String(255), nullable=True)
    activo = Column(Boolean, default=True)
    role = Column(String(50), nullable=True)