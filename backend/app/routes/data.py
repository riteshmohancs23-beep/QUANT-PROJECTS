"""
routes/data.py
==============
Exposes raw market data and engineered features over HTTP.

Endpoints
---------
GET /data?ticker=SPY&start=2020-01-01&end=2024-01-01
    Returns OHLCV + log returns, 10-day volatility, and 20-day SMA
    for the requested ticker and date range.
    Results are cached in memory for 1 hour.
"""

from fastapi import APIRouter, HTTPException, Query
from datetime import date
from typing import Optional
from app.services.data_service import DataService
from app.models.schemas import HistoricalDataResponse

router = APIRouter(prefix="/data", tags=["data"])


@router.get("", response_model=HistoricalDataResponse)
async def get_historical_data(
    ticker: str = Query("SPY", description="Yahoo Finance ticker symbol"),
    start: Optional[date] = None,
    end:   Optional[date] = None,
):
    """
    Fetch OHLCV data and computed features for a ticker.

    - Defaults to the last 5 years if start/end are omitted
    - Returns NaN fields as null in JSON
    - Raises HTTP 400 if the ticker is invalid or no data is found
    """
    try:
        df = DataService.get_historical_data(ticker, start, end)
        df = df.replace({float("nan"): None})

        data_points = []
        for _, row in df.iterrows():
            data_points.append({
                "date":       row["Date"],
                "open":       float(row["Open"])       if row["Open"]       is not None else 0.0,
                "high":       float(row["High"])       if row["High"]       is not None else 0.0,
                "low":        float(row["Low"])        if row["Low"]        is not None else 0.0,
                "close":      float(row["Close"])      if row["Close"]      is not None else 0.0,
                "volume":     int(row["Volume"])       if row["Volume"]     is not None else 0,
                "returns":    float(row["Returns"])    if row["Returns"]    is not None else None,
                "volatility": float(row["Volatility"]) if row["Volatility"] is not None else None,
                "sma20":      float(row["SMA20"])      if row["SMA20"]      is not None else None,
            })

        return {"ticker": ticker, "data": data_points}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
