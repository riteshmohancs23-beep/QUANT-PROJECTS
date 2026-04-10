# Market Regime Detection

> A full-stack quantitative finance application that detects **Bull**, **Bear**, and **Sideways** market regimes from historical price data using a **Hidden Markov Model (HMM)**, served via a **FastAPI** backend and visualised in a **React** frontend.

---

## What This Project Does

### Core Intelligence — Hidden Markov Model
- Downloads historical OHLCV data for any ticker via **yfinance** (stocks, ETFs, crypto, indices)
- Engineers three features per trading day:
  - **Log Return** — daily price change, stationary and normally distributed
  - **10-day Rolling Volatility** — standard deviation of returns, proxy for market risk
  - **20-day SMA** — smoothed trend signal
- Fits a **3-state Gaussian HMM** (`hmmlearn`) on the feature matrix
- Decodes the most-likely hidden state sequence using the Viterbi algorithm
- Automatically labels states by ranking mean return:
  - 🟢 **Bull** — highest mean return, low volatility
  - 🔴 **Bear** — lowest (negative) mean return, high volatility
  - 🟡 **Sideways** — middle return, moderate volatility

### Why HMM and not KMeans?
Markets exhibit **regime persistence** — once in a Bear market, it tends to stay Bear for days or weeks. HMMs model this via a **transition probability matrix**, making regime sequences smooth and realistic. KMeans treats every day as independent, producing noisy, fragmented labels.

### Trading Strategy Backtest
- **Bull regime** → invested (receive full market return)
- **Bear / Sideways** → cash (0% return)
- Regime is **lagged by 1 day** to eliminate look-ahead bias
- Cumulative returns computed for both strategy and buy-and-hold
- Outperformance delta displayed in the UI

### Data Persistence & Caching
- Regime results persisted to **SQLite** via **SQLAlchemy async ORM**
- In-memory **TTL cache** (1 hour) avoids redundant yfinance downloads on repeated requests

### REST API (FastAPI)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/health` | Health check |
| `GET`  | `/data?ticker=SPY&start=2020-01-01&end=2024-01-01` | OHLCV + engineered features |
| `POST` | `/train-model` | Fit HMM, persist regimes to SQLite |
| `GET`  | `/regimes?ticker=SPY` | Regime label per date |
| `GET`  | `/strategy-performance?ticker=SPY` | Cumulative return series |

### Frontend (React + Vite + Tailwind + Recharts)
- Pure black (`#000`) glassmorphism UI with gradient borders
- Sticky navbar with live progress bar during analysis
- Quick-pick ticker presets (SPY, QQQ, AAPL, BTC-USD, TSLA, GLD)
- **Price Chart** — close price line with colour-coded regime background shading
- **Regime Timeline** — run-length encoded horizontal bar + per-regime stat cards
- **Strategy Chart** — dual-line cumulative return comparison with outperformance badge
- Custom tooltips, animated dual-ring spinner, current regime live badge

---

## Architecture

```
┌─────────────────────────────────────────────┐
│         Frontend  (React + Vite)            │
│  InputPanel · PriceChart · RegimeTimeline   │
│  StrategyChart · LoadingSpinner             │
└──────────────────┬──────────────────────────┘
                   │  HTTP / REST (axios)
┌──────────────────▼──────────────────────────┐
│         Backend  (FastAPI)                  │
│  /data  ·  /train-model                     │
│  /regimes  ·  /strategy-performance         │
└──────┬──────────────┬───────────────────────┘
       │              │
   yfinance       hmmlearn
  (market data)  (HMM model)
       │              │
       └──────┬───────┘
          SQLite DB
       (regime_results)
```

---

## Project Structure

```
MARKET_REGIME_DETECTION/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, CORS, router registration
│   │   ├── routes/
│   │   │   ├── data.py              # GET /data
│   │   │   ├── model.py             # POST /train-model, GET /regimes
│   │   │   └── strategy.py          # GET /strategy-performance
│   │   ├── services/
│   │   │   ├── data_service.py      # yfinance fetch + feature engineering
│   │   │   ├── hmm_service.py       # HMM training, labelling, DB persistence
│   │   │   └── strategy_service.py  # Backtest cumulative return calculation
│   │   ├── models/
│   │   │   └── schemas.py           # Pydantic request/response models
│   │   └── utils/
│   │       ├── db.py                # SQLAlchemy async engine + RegimeResult ORM model
│   │       └── cache.py             # In-memory TTL cache
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── Dashboard.jsx        # Main layout, state management, API orchestration
│   │   ├── components/
│   │   │   ├── InputPanel.jsx       # Ticker input, date pickers, preset buttons
│   │   │   ├── PriceChart.jsx       # Recharts ComposedChart with regime shading
│   │   │   ├── RegimeTimeline.jsx   # RLE timeline bar + stat cards
│   │   │   ├── StrategyChart.jsx    # Dual-line backtest chart
│   │   │   └── LoadingSpinner.jsx   # Dual-ring animated spinner
│   │   └── services/
│   │       └── api.js               # Axios wrapper for all endpoints
│   ├── tailwind.config.js
│   └── package.json
├── documentation/                   # Full technical docs — read these to understand every decision
└── README.md
```

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1 — Backend

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn app.main:app --reload --port 8000
```

- API → `http://localhost:8000`
- Swagger UI → `http://localhost:8000/docs`
- ReDoc → `http://localhost:8000/redoc`

### 2 — Frontend

Open a **new terminal tab**, then:

```bash
cd frontend
npm install
npm run dev
```

- App → `http://localhost:5173`

---

## Usage

1. Open `http://localhost:5173`
2. Enter a ticker symbol (e.g. `SPY`, `AAPL`, `BTC-USD`, `^NSEI`)
3. Select a date range (default: last 5 years)
4. Click **Run Detection**
5. View:
   - Price chart with Bull/Bear/Sideways background shading
   - Regime distribution timeline with percentage breakdown
   - Strategy vs Buy & Hold cumulative return comparison

---

## Supported Tickers (examples)

| Category | Tickers |
|----------|---------|
| US Indices | `SPY`, `QQQ`, `DIA`, `IWM` |
| US Stocks | `AAPL`, `MSFT`, `GOOGL`, `TSLA`, `NVDA`, `META` |
| Crypto | `BTC-USD`, `ETH-USD`, `SOL-USD` |
| Commodities | `GLD`, `USO`, `TLT` |
| India | `^NSEI`, `^BSESN`, `RELIANCE.NS`, `TCS.NS`, `INFY.NS` |

---

## API Quick Test

```bash
# Health check
curl http://localhost:8000/health

# Fetch OHLCV + features
curl "http://localhost:8000/data?ticker=SPY&start=2020-01-01&end=2024-01-01"

# Train HMM and persist regimes
curl -X POST http://localhost:8000/train-model \
  -H "Content-Type: application/json" \
  -d '{"ticker":"SPY","start":"2020-01-01","end":"2024-01-01"}'

# Get regime labels
curl "http://localhost:8000/regimes?ticker=SPY"

# Get strategy performance
curl "http://localhost:8000/strategy-performance?ticker=SPY"
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS v3, Recharts, Axios |
| Backend | FastAPI, Uvicorn, Pydantic v2 |
| ML | hmmlearn (GaussianHMM), scikit-learn, NumPy, Pandas |
| Data | yfinance |
| Database | SQLite + SQLAlchemy async ORM + aiosqlite |

---

## Disclaimer

This project is for **educational and research purposes only**. Regime labels are backward-looking in-sample predictions. Do not use this as the sole basis for real trading decisions.
