
# app/db/session.py
from sqlmodel import create_engine, Session
from app.core.config import settings

connect_args: dict = {}

db_url = settings.database_url

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Neon e outros PostgreSQL hospedados requerem SSL
if "neon.tech" in db_url or "neon" in db_url:
    # Garante sslmode=require na connection string
    if "sslmode" not in db_url:
        separator = "&" if "?" in db_url else "?"
        db_url = f"{db_url}{separator}sslmode=require"

engine = create_engine(db_url, echo=False, connect_args=connect_args)

def get_session():
    with Session(engine) as session:
        yield session
