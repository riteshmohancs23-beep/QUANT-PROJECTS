"""
strategy_service.py
===================
Computes the backtested performance of the HMM-based trading strategy.

Strategy Logic
--------------
- Bull regime  → fully invested (receive the market's log return for that day)
- Bear/Sideways → hold cash (0% return)
- The regime signal is lagged by 1 day (shift(1)) to eliminate look-ahead bias:
  we only know yesterday's regime when deciding today's position.

Features
--------
- Reads persisted regime labels from SQLite (train-model must be called first)
- Computes cumulative returns for both the strategy and a buy-and-hold benchmark
  using (1 + r).cumprod() - 1  so the result is a percentage gain from day 1
- Returns a time-series list suitable for direct charting in the frontend
"""

import pandas as pd
from typing import List, Dict, Any
from app.utils.db import AsyncSessionLocal, RegimeResult
from sqlalchemy import select


class StrategyService:

    @staticmethod
    async def get_strategy_performance(ticker: str) -> List[Dict[str, Any]]:
        """
        Calculate and return cumulative returns for:
          - Buy & Hold  : always invested, receives full market return every day
          - HMM Strategy: invested only when yesterday's regime was Bull

        Parameters
        ----------
        ticker : str  — must have been trained via /train-model first

        Returns
        -------
        List of dicts with keys: date, buy_and_hold_return, strategy_return, regime
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
            raise ValueError(
                f"No regime data found for '{ticker}'. Call POST /train-model first."
            )

        df = pd.DataFrame([{
            "date":        r.date,
            "returns":     r.returns if r.returns is not None else 0.0,
            "regime_name": r.regime_name,
        } for r in records])

        # Lag regime by 1 day — today's position is based on yesterday's signal
        df["prev_regime"] = df["regime_name"].shift(1)

        # Strategy return: market return if yesterday was Bull, else 0
        df["strategy_return"] = df.apply(
            lambda row: row["returns"]
            if (not pd.isna(row["prev_regime"]) and row["prev_regime"] == "Bull")
            else 0.0,
            axis=1,
        )

        df["returns"] = df["returns"].fillna(0.0)

        # Cumulative return = (1 + r1)(1 + r2)... - 1
        df["cum_bnh"]      = (1 + df["returns"]).cumprod() - 1
        df["cum_strategy"] = (1 + df["strategy_return"]).cumprod() - 1

        return [
            {
                "date":               row["date"],
                "buy_and_hold_return": float(row["cum_bnh"]),
                "strategy_return":     float(row["cum_strategy"]),
                "regime":              row["regime_name"],
            }
            for _, row in df.iterrows()
        ]
