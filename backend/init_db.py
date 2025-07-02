from db import Base, engine
import models

print("📦 Inicializando base de datos...")

Base.metadata.create_all(bind=engine)

print("✅ Tablas creadas correctamente.")