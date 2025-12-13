# database.py
import os
import urllib.parse
from typing import Generator
from fastapi import Header
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s"
)

logger = logging.getLogger("HRM")


# MASTER DB
DB_USER = os.getenv("MASTER_DB_USER", "root")
DB_PASSWORD = os.getenv("MASTER_DB_PASSWORD", "")
DB_HOST = os.getenv("MASTER_DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("MASTER_DB_PORT", "3306")
MASTER_DB_NAME = os.getenv("MASTER_DB_NAME", "hrm_master")

MASTER_DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{urllib.parse.quote_plus(DB_PASSWORD)}"
    f"@{DB_HOST}:{DB_PORT}/{MASTER_DB_NAME}"
)

master_engine = create_engine(
    MASTER_DATABASE_URL,
    pool_pre_ping=True,
    future=True
)

MasterSessionLocal = sessionmaker(bind=master_engine, autoflush=False, autocommit=False)


def get_master_db() -> Generator:
    db = MasterSessionLocal()
    try:
        yield db
    finally:
        db.close()


# CREATE TENANT
def create_tenant_database(db_name: str):

    url_no_db = f"mysql+pymysql://{DB_USER}:{urllib.parse.quote_plus(DB_PASSWORD)}@{DB_HOST}:{DB_PORT}/"
    engine = create_engine(url_no_db, pool_pre_ping=True, future=True)

    with engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text(f"""
            CREATE DATABASE IF NOT EXISTS `{db_name}`
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci;
        """))

    engine.dispose()

    # Import inside function (avoid circular import)
    from routes.tenant_seed import seed_tenant
    seed_tenant(db_name)


# TENANT ENGINE
def get_tenant_engine(db_name: str):
    url = (
        f"mysql+pymysql://{DB_USER}:{urllib.parse.quote_plus(DB_PASSWORD)}"
        f"@{DB_HOST}:{DB_PORT}/{db_name}"
    )
    return create_engine(url, pool_pre_ping=True, future=True)


# TENANT DB SESSION (for dependency injection)
def get_tenant_db(Authorization: str = Header(None)) -> Generator:
    from utils.token import verify_token
    
    # Try to get tenant DB from Authorization header
    tenant_db_name = os.getenv("DEFAULT_TENANT_DB", "nutryah")  # Default fallback
    
    if Authorization:
        try:
            # Extract token from "Bearer <token>" format
            token = Authorization.split(" ")[1] if " " in Authorization else Authorization
            payload = verify_token(token)
            if payload and "tenant_db" in payload:
                tenant_db_name = payload["tenant_db"]
                logger.info(f"Using tenant DB from token: {tenant_db_name}")
            else:
                logger.warning(f"No tenant_db in token payload, using default: {tenant_db_name}")
        except Exception as e:
            logger.warning(f"Error parsing Authorization header, using default tenant DB: {tenant_db_name}. Error: {str(e)}")
    else:
        logger.info(f"No Authorization header provided, using default tenant DB: {tenant_db_name}")
    
    engine = get_tenant_engine(tenant_db_name)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
