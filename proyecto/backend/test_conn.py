# quick_test_v2.py
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

engine = create_engine("postgresql+psycopg2://postgres:1234@localhost:5432/aula_eficiente")

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version();"))
        print("✅ OK:", result.scalar())
except OperationalError as e:
    print("❌ Conn error:", e)
except Exception as e:
    print("❌ Unexpected error:", e)
