"""
main.py
=======
FastAPI application entry point.

Features
--------
- Registers all routers: /data, /train-model, /regimes, /strategy-performance
- Configures CORS to allow requests from the React dev server (localhost:5173)
- Initialises the SQLite database tables on startup via the lifespan context manager
- Exposes GET /health for uptime monitoring
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import data, model, strategy
from app.utils.db import init_db
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup; clean up on shutdown."""
    await init_db()
    yield


app = FastAPI(
    title="Market Regime Detection API",
    description="Detects Bull / Bear / Sideways market regimes using a Gaussian HMM.",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow the React dev server to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data.router)
app.include_router(model.router)
app.include_router(strategy.router)


@app.get("/health", tags=["health"])
async def health_check():
    """Simple liveness probe — returns 200 OK when the API is running."""
    return {"status": "ok", "message": "API is running"}
