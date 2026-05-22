import sys
import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# --------------------------------------
#   Ajustamos la ruta raíz del proyecto
# --------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

# --------------------------------------
#   Importamos Base y Models
# --------------------------------------
from database import Base
import models  # aquí están todas tus clases

# --------------------------------------
#   Configuración de Logging
# --------------------------------------
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# --------------------------------------
#   Metadata de los modelos
# --------------------------------------
target_metadata = Base.metadata

# --------------------------------------
#   Funciones de Alembic
# --------------------------------------
def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


# --------------------------------------
#   Punto de entrada de Alembic
# --------------------------------------
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
