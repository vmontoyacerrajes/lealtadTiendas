# models/clientes_passwords.py
from sqlalchemy import Column, Integer, String, ForeignKey
from db.database import Base

class ClientePassword(Base):
    __tablename__ = "clientes_passwords"

    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"), primary_key=True)
    password = Column(String(255), nullable=False)