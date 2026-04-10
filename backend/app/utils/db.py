from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import Float, Integer, String, Date
from datetime import date
import os

DATABASE_URL = "sqlite+aiosqlite:///./market_regime.db"

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class RegimeResult(Base):
    __tablename__ = "regime_results"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(20), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    close: Mapped[float] = mapped_column(Float)
    returns: Mapped[float] = mapped_column(Float, nullable=True)
    volatility: Mapped[float] = mapped_column(Float, nullable=True)
    regime: Mapped[int] = mapped_column(Integer)
    regime_name: Mapped[str] = mapped_column(String(20))

async def init_db():
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
