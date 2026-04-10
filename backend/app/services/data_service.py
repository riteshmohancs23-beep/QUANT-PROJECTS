"""
data_service.py
===============
Responsible for fetching and preparing market data.

Features
--------
- Downloads historical OHLCV data for any valid Yahoo Finance ticker via yfinance
- Handles the MultiIndex column format introduced in newer yfinance versions
- Computes three features used by the HMM:
    * Log Return       : log(Close_t / Close_{t-1})  — stationary, approx. normal
    * 10-day Volatility: rolling std of log returns   — proxy for market risk
    * 20-day SMA       : smoothed price trend signal
- Drops NaN rows produced by rolling windows (first ~20 rows)
- Caches results in memory for 1 hour to avoid redundant network calls
- Raises ValueError with a clear message if the ticker is invalid or delisted
"""

import yfinance as yf
import pandas as pd
import numpy as np
from datetime import date, timedelta
from typing import Optional
from app.utils.cache import df_cache


class DataService:
    @staticmethod
    def get_historical_data(
        ticker: str,
        start: Optional[date] = None,
        end: Optional[date] = None,
    ) -> pd.DataFrame:
        """
        Fetch and engineer features for a given ticker and date range.

        Parameters
        ----------
        ticker : str
            Yahoo Finance symbol, e.g. 'SPY', 'BTC-USD', '^NSEI'
        start  : date, optional
            Start date (defaults to 5 years before end)
        end    : date, optional
            End date (defaults to today)

        Returns
        -------
        pd.DataFrame
            Columns: Date, Open, High, Low, Close, Volume, Returns, Volatility, SMA20
        """
        if not end:
            end = date.today()
        if not start:
            start = end - timedelta(days=5 * 365)

        # Return cached result if available (TTL = 1 hour)
        cache_key = f"{ticker}_{start}_{end}"
        cached = df_cache.get(cache_key)
        if cached is not None:
            return cached

        raw = yf.download(ticker, start=str(start), end=str(end),
                          auto_adjust=True, progress=False)

        if raw.empty:
            raise ValueError(f"No data found for ticker '{ticker}'")

        # Newer yfinance returns MultiIndex columns like ('Close', 'SPY') — flatten to 'Close'
        if isinstance(raw.columns, pd.MultiIndex):
            raw.columns = raw.columns.get_level_values(0)

        df = raw[["Open", "High", "Low", "Close", "Volume"]].copy()
        df.reset_index(inplace=True)
        df.rename(columns={"index": "Date"}, inplace=True)
        df["Date"] = pd.to_datetime(df["Date"]).dt.date

        # Feature 1: Log return — preferred over simple return for HMM because
        # it is additive over time and approximately normally distributed
        df["Returns"] = np.log(df["Close"] / df["Close"].shift(1))

        # Feature 2: 10-day rolling volatility — captures the risk level of each regime
        df["Volatility"] = df["Returns"].rolling(window=10).std()

        # Feature 3: 20-day simple moving average — smoothed trend signal
        df["SMA20"] = df["Close"].rolling(window=20).mean()

        # Drop the first ~20 rows that have NaN due to rolling windows
        df.dropna(inplace=True)
        df.reset_index(drop=True, inplace=True)

        df_cache.set(cache_key, df)
        return df
