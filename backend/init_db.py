from db.database import Base, engine
import models
import time

print("📦 Inicializando base de datos...")

time.sleep(5)
Base.metadata.create_all(bind=engine)

print("✅ Tablas creadas correctamente.")