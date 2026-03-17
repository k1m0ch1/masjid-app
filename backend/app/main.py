import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from app.core.config import settings
from app.api.v1 import auth, jamaah, finance, events, ziswaf, whatsapp, setting, user_access, upload
from app.api.v1.whatsapp import run_scheduler
from app.db.session import engine, Base
from app.services import cache
from app.services.cache_worker import run_cache_worker


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Init Redis cache (non-fatal if unavailable)
    await cache.init_cache()
    # Start WA message queue scheduler + cache invalidation worker
    task = asyncio.create_task(run_scheduler())
    cache_task = asyncio.create_task(run_cache_worker())

    # Run DB migrations
    with engine.connect() as conn:
        # Convert enum columns to varchar in transactions table
        for col in ["income_category", "expense_category", "payment_method"]:
            try:
                conn.execute(text(f"""
                    DO $$ BEGIN
                        IF EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_name = 'transactions'
                              AND column_name = '{col}'
                              AND data_type = 'USER-DEFINED'
                        ) THEN
                            ALTER TABLE transactions ALTER COLUMN {col} TYPE VARCHAR USING {col}::VARCHAR;
                        END IF;
                    END $$
                """))
            except Exception:
                pass
        # Add new columns if not exist
        for col_def in [
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE",
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source_type VARCHAR",
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source_id UUID",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_allowed BOOLEAN DEFAULT FALSE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed_modules VARCHAR[] DEFAULT ARRAY[]::VARCHAR[]",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP",
        ]:
            try:
                conn.execute(text(col_def))
            except Exception:
                pass
        # Migrate budgets.category from enum to varchar if needed
        try:
            conn.execute(text("""
                DO $$ BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'budgets'
                          AND column_name = 'category'
                          AND data_type = 'USER-DEFINED'
                    ) THEN
                        ALTER TABLE budgets ALTER COLUMN category TYPE VARCHAR USING category::VARCHAR;
                    END IF;
                END $$
            """))
        except Exception:
            pass
        conn.commit()

    # ALTER TYPE ADD VALUE must run outside a transaction (autocommit)
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as ac:
        for sql in [
            "ALTER TYPE jamaahrole ADD VALUE IF NOT EXISTS 'USTADZ'",
            "ALTER TYPE economicstatus ADD VALUE IF NOT EXISTS 'TIDAK_DISEBUTKAN'",
        ]:
            try:
                ac.execute(text(sql))
            except Exception:
                pass

    # Create any missing tables (e.g. mosque_settings)
    # Import models to ensure they're registered with Base metadata
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine, checkfirst=True)

    yield
    task.cancel()
    cache_task.cancel()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for receipt files
os.makedirs("uploads/receipts", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
    }


# Include routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX, tags=["Authentication"])
app.include_router(jamaah.router, prefix=settings.API_V1_PREFIX, tags=["Jamaah"])
app.include_router(finance.router, prefix=settings.API_V1_PREFIX, tags=["Finance"])
app.include_router(events.router, prefix=settings.API_V1_PREFIX, tags=["Events"])
app.include_router(ziswaf.router, prefix=settings.API_V1_PREFIX, tags=["ZISWAF"])
app.include_router(whatsapp.router, prefix=settings.API_V1_PREFIX, tags=["WhatsApp"])
app.include_router(setting.router, prefix=settings.API_V1_PREFIX, tags=["Settings"])
app.include_router(user_access.router, prefix=settings.API_V1_PREFIX, tags=["User Access"])
app.include_router(upload.router, prefix=settings.API_V1_PREFIX, tags=["Upload"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
