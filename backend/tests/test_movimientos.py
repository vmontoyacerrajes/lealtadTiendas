import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from db.database import Base, get_db

# DB de pruebas (sqlite en memoria)
engine_test = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

@pytest.fixture(autouse=True, scope="function")
def setup_db():
    Base.metadata.create_all(bind=engine_test)
    yield
    Base.metadata.drop_all(bind=engine_test)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_crear_cliente_y_acumular():
    # Crear cliente
    r = client.post("/clientes/", json={
        "nombre": "Ana",
        "correo": "ana@example.com",
        "telefono": "555-123",
        "codigo_sap": "SAP-001"
    })
    assert r.status_code == 200, r.text
    cid = r.json()["id_cliente"]

    # Acumular
    r2 = client.post("/movimientos/", json={
        "id_cliente": cid,
        "tipo": "acumulado",
        "puntos": 100,
        "descripcion": "Ticket F-1",
        "referencia": "F-1"
    })
    assert r2.status_code == 200, r2.text

    # Duplicado mismo ticket -> debe fallar
    r3 = client.post("/movimientos/", json={
        "id_cliente": cid,
        "tipo": "acumulado",
        "puntos": 100,
        "descripcion": "Ticket F-1",
        "referencia": "F-1"
    })
    assert r3.status_code in (400, 409)