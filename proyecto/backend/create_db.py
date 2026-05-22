# create_tables_only.py
import os
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from database import Base
import models  # importa tus modelos

DEFAULT_DB_URL = "postgresql+psycopg2://postgres:1234@localhost:5432/aula_eficiente"

def get_db_url():
    url = os.getenv("DATABASE_URL")
    if url:
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url
    return DEFAULT_DB_URL

def test_connection(engine):
    try:
        with engine.connect() as conn:
            version = conn.execute(text("SELECT version();")).scalar()
            print("✅ Connected to:", version)
            return True
    except OperationalError as e:
        print("❌ OperationalError connecting to DB:", e)
        return False
    except Exception as e:
        print("❌ Unexpected error:", e)
        return False

def create_tables(engine):
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created (or already existed).")
    except Exception as e:
        print("❌ Error creating tables:", e)
        raise

if __name__ == "__main__":
    db_url = get_db_url()
    print("Using DB URL:", db_url)
    engine = create_engine(db_url)

    if test_connection(engine):
        create_tables(engine)
    else:
        print("\nCheck that:\n - PostgreSQL is running\n - DB 'aula_eficiente' exists\n - Credentials are correct\n - Port 5432 is correct\n")
