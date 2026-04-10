"""
routes/strategy.py
==================
Endpoint for the HMM-based trading strategy backtest.

Endpoint
--------
GET /strategy-performance?ticker=SPY
    Reads persisted regime labels from SQLite and computes:
      - Buy & Hold cumulative return  : always invested
      - HMM Strategy cumulative return: invested only when yesterday's regime = Bull
    The 1-day lag on the regime signal prevents look-ahead bias.
    Returns a time-series list for direct use in the frontend chart.
    Raises HTTP 404 if train-model has not been called for this ticker.
"""

from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import StrategyPerformanceResponse
from app.services.strategy_service import StrategyService

router = APIRouter(tags=["strategy"])


@router.get("/strategy-performance", response_model=StrategyPerformanceResponse)
async def get_strategy_performance(ticker: str = Query("SPY")):
    """
    Return cumulative returns for the Bull-only HMM strategy vs buy-and-hold.
    Requires /train-model to have been called first for this ticker.
    """
    try:
        performance = await StrategyService.get_strategy_performance(ticker)
        return {"ticker": ticker, "performance": performance}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
