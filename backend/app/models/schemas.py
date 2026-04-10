from datetime import date
from typing import List, Optional
from pydantic import BaseModel, Field

# --- Requests ---

class ModelTrainRequest(BaseModel):
    ticker: str = Field(default="^GSPC", description="Stock ticker symbol")
    start: Optional[date] = None
    end: Optional[date] = None

# --- Responses ---

class HealthResponse(BaseModel):
    status: str
    message: str

class TradeDataPoint(BaseModel):
    date: date
    open: float
    high: float
    low: float
    close: float
    volume: int
    returns: Optional[float] = None
    volatility: Optional[float] = None
    sma20: Optional[float] = None

class HistoricalDataResponse(BaseModel):
    ticker: str
    data: List[TradeDataPoint]

class RegimeLabel(BaseModel):
    date: date
    regime: int  # e.g., 0, 1, 2
    regime_name: str # 'Bull', 'Bear', 'Sideways'
    close: float

class RegimeResponse(BaseModel):
    ticker: str
    regimes: List[RegimeLabel]

class StrategyDataPoint(BaseModel):
    date: date
    buy_and_hold_return: float
    strategy_return: float
    regime: str

class StrategyPerformanceResponse(BaseModel):
    ticker: str
    performance: List[StrategyDataPoint]
