"""
hmm_service.py
==============
Core machine-learning service — trains the Hidden Markov Model and persists results.

Why HMM?
--------
Financial markets cycle through distinct regimes (Bull, Bear, Sideways) that persist
for days or weeks before transitioning. A Hidden Markov Model explicitly captures this
persistence via a transition probability matrix P(state_t | state_{t-1}), making regime
sequences smooth and realistic. Plain clustering (e.g. KMeans) treats every day as
independent and produces noisy, fragmented labels.

Features
--------
- Fits a 3-state GaussianHMM on [log_return * 100, volatility * 100]
  (scaled by 100 for numerical stability during covariance estimation)
- Uses full covariance matrices so each state can model correlated features
- Runs 1000 EM iterations with a fixed random seed for reproducibility
- Maps integer states (0/1/2) to economic labels by ranking mean return:
    highest mean return  → Bull
    middle mean return   → Sideways
    lowest mean return   → Bear
- Clears stale DB rows for the ticker before inserting fresh results
- Casts all numpy types (int64, float64) to native Python before DB insert
  to prevent SQLAlchemy from storing raw bytes instead of integers
"""

import numpy as np
import pandas as pd
from hmmlearn import hmm
from app.utils.db import AsyncSessionLocal, RegimeResult
from app.services.data_service import DataService
from sqlalchemy import delete
from datetime import date
from typing import Optional


class HMMService:

    @staticmethod
    def train_hmm(df: pd.DataFrame, n_components: int = 3):
        """
        Fit a Gaussian HMM on log returns and volatility.

        Parameters
        ----------
        df           : DataFrame with 'Returns' and 'Volatility' columns
        n_components : number of hidden states (default 3)

        Returns
        -------
        model        : fitted GaussianHMM instance
        hidden_states: np.ndarray of predicted state indices per row
        """
        # Scale by 100 so returns (~0.001) and volatility (~0.01) are on a similar
        # magnitude, which improves numerical stability of the EM covariance updates
        X = np.column_stack([df["Returns"] * 100, df["Volatility"] * 100])

        model = hmm.GaussianHMM(
            n_components=n_components,
            covariance_type="full",   # full covariance captures feature correlations
            n_iter=1000,
            random_state=42,          # reproducible results
        )
        model.fit(X)
        hidden_states = model.predict(X)   # Viterbi decoding
        return model, hidden_states

    @staticmethod
    def map_regimes_to_labels(
        df: pd.DataFrame,
        hidden_states: np.ndarray,
        n_components: int = 3,
    ) -> dict:
        """
        Map integer HMM states to economic regime names.

        Logic: rank states by their mean log return.
          - Highest mean return  → Bull   (market trending up)
          - Lowest  mean return  → Bear   (market trending down / crashing)
          - Middle  mean return  → Sideways (range-bound, low conviction)

        Returns
        -------
        dict mapping state integer → regime name string
        """
        df_temp = df.copy()
        df_temp["State"] = hidden_states
        state_means = df_temp.groupby("State")["Returns"].mean().to_dict()
        sorted_states = sorted(state_means.items(), key=lambda x: x[1])

        mapping = {}
        if n_components == 3:
            mapping[sorted_states[0][0]] = "Bear"
            mapping[sorted_states[1][0]] = "Sideways"
            mapping[sorted_states[2][0]] = "Bull"
        elif n_components == 2:
            mapping[sorted_states[0][0]] = "Bear"
            mapping[sorted_states[1][0]] = "Bull"
        return mapping

    @staticmethod
    async def run_pipeline(
        ticker: str,
        start: Optional[date] = None,
        end: Optional[date] = None,
    ):
        """
        Full end-to-end pipeline:
          1. Fetch & engineer features via DataService
          2. Train GaussianHMM
          3. Map states to Bull / Bear / Sideways
          4. Persist results to SQLite (upsert by ticker)

        Returns
        -------
        dict with success message and number of records processed
        """
        df = DataService.get_historical_data(ticker, start, end)

        if len(df) < 50:
            raise ValueError("Not enough data to train HMM (need at least 50 trading days)")

        model, hidden_states = HMMService.train_hmm(df)
        mapping = HMMService.map_regimes_to_labels(df, hidden_states)
        regime_names = [mapping[state] for state in hidden_states]

        async with AsyncSessionLocal() as session:
            async with session.begin():
                # Delete stale rows so re-running with a new date range is clean
                await session.execute(
                    delete(RegimeResult).where(RegimeResult.ticker == ticker)
                )
                records = []
                for i in range(len(df)):
                    records.append(RegimeResult(
                        ticker=ticker,
                        date=df["Date"].iloc[i],
                        # Cast numpy types to native Python — prevents SQLAlchemy
                        # from storing raw bytes (int64 binary) instead of integers
                        close=float(df["Close"].iloc[i]),
                        returns=float(df["Returns"].iloc[i]),
                        volatility=float(df["Volatility"].iloc[i]),
                        regime=int(hidden_states[i]),
                        regime_name=regime_names[i],
                    ))
                session.add_all(records)

        return {
            "message": "Model trained and results saved successfully",
            "records_processed": len(records),
        }
