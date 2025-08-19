from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# ---------------------------
# Base de datos de lealtad
# ---------------------------
LEALTAD_DB_URL = f"mysql+mysqlconnector://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"

engine = create_engine(LEALTAD_DB_URL)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------------------
# Base de datos de Moving (usuarios)
# ---------------------------
MOVING_DB_URL = f"mysql+mysqlconnector://{os.getenv('MOVING_USER')}:{os.getenv('MOVING_PASSWORD')}@{os.getenv('MOVING_HOST')}:{os.getenv('MOVING_PORT')}/{os.getenv('MOVING_DB')}"

engine_moving = create_engine(MOVING_DB_URL)
SessionMoving = sessionmaker(bind=engine_moving, autocommit=False, autoflush=False)
BaseMoving = declarative_base()

def get_moving_db():
    db = SessionMoving()
    try:
        yield db
    finally:
        db.close()