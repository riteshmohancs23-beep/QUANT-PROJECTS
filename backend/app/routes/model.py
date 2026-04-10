"""
routes/model.py
===============
Endpoints for training the HMM and retrieving regime labels.

Endpoints
---------
POST /train-model
    Body: { "ticker": "SPY", "start": "2020-01-01", "end": "2024-01-01" }
    Triggers the full HMM pipeline:
      1. Fetch data via DataService
      2. Fit GaussianHMM (3 states, full covariance, 1000 iterations)
      3. Map states → Bull / Bear / Sideways by mean return ranking
      4. Persist results to SQLite (old rows for this ticker are replaced)
    Returns: { "message": "...", "records_processed": N }

GET /regimes?ticker=SPY
    Returns the persisted regime label for every trading day.
    Raises HTTP 404 if train-model has not been called for this ticker yet.
"""

from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import ModelTrainRequest, RegimeResponse
from app.services.hmm_service import HMMService
from app.utils.db import AsyncSessionLocal, RegimeResult
from sqlalchemy import select

router = APIRouter(tags=["model"])


@router.post("/train-model")
async def train_model(request: ModelTrainRequest):
    """
    Run the full HMM training pipeline for the given ticker and date range.
    Idempotent — re-running replaces previous results for the same ticker.
    """
    try:
        result = await HMMService.run_pipeline(request.ticker, request.start, request.end)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/regimes", response_model=RegimeResponse)
async def get_regimes(ticker: str = Query("SPY")):
    """
    Return the regime label (Bull / Bear / Sideways) for every trading day
    stored in the database for the given ticker.
    """
    async with AsyncSessionLocal() as session:
        stmt = (
            select(RegimeResult)
            .where(RegimeResult.ticker == ticker)
            .order_by(RegimeResult.date)
        )
        result = await session.execute(stmt)
        records = result.scalars().all()

    if not records:
        raise HTTPException(
            status_code=404,
            detail=f"No regime data for '{ticker}'. Call POST /train-model first.",
        )

    regime_data = [
        {
            "date":        r.date,
            "regime":      int(r.regime),       # cast to avoid Pydantic bytes error
            "regime_name": r.regime_name,
            "close":       float(r.close),
        }
        for r in records
    ]
    return {"ticker": ticker, "regimes": regime_data}
