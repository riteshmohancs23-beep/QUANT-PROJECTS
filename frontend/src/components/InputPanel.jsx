import { useState } from "react";
import TickerSearch from "./TickerSearch";

const REGIMES = [
  { name: "Bull",     color: "#2ecc71", desc: "High return, low volatility" },
  { name: "Bear",     color: "#e74c3c", desc: "Negative return, high volatility" },
  { name: "Sideways", color: "#f39c12", desc: "Low return, low volatility" },
];

const PRESETS = ["SPY", "QQQ", "AAPL", "BTC-USD", "TSLA", "GLD"];

export default function InputPanel({ onSubmit, loading }) {
  const today      = new Date().toISOString().split("T")[0];
  const fiveYrsAgo = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [ticker, setTicker] = useState("SPY");
  const [start,  setStart]  = useState(fiveYrsAgo);
  const [end,    setEnd]    = useState(today);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ticker: ticker.trim().toUpperCase(), start, end });
  };

  return (
    <div className="flex flex-col gap-4">

      {/* Brand card */}
      <div className="glass gradient-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-zinc-500 font-mono tracking-widest uppercase">Live Analysis</span>
        </div>
        <h1 className="text-lg font-semibold text-white leading-tight">Market Regime</h1>
        <p className="text-xs text-zinc-600 mt-0.5">Hidden Markov Model · HMM</p>
      </div>

      {/* Search card */}
      <div className="glass rounded-2xl p-5">
        <TickerSearch onSelect={(sym) => setTicker(sym)} />

        {/* Selected ticker display */}
        {ticker && (
          <div className="mt-3 flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
            <span className="text-xs text-zinc-500">Selected:</span>
            <span className="text-sm font-mono font-semibold text-indigo-400">{ticker}</span>
            <button
              type="button"
              onClick={() => setTicker("")}
              className="ml-auto text-zinc-700 hover:text-zinc-400 text-xs transition-colors"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Config card */}
      <div className="glass rounded-2xl p-5">
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono mb-4">Configuration</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Manual ticker input */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Ticker Symbol</label>
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="e.g. SPY, AAPL, BTC-USD"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors placeholder-zinc-700"
              required
            />
            {/* Quick presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRESETS.map((p) => (
                <button
                  key={p} type="button"
                  onClick={() => setTicker(p)}
                  className={`text-xs px-2 py-0.5 rounded-md font-mono transition-colors ${
                    ticker === p
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-zinc-800"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-2">
            {[["Start", start, setStart], ["End", end, setEnd]].map(([label, val, setter]) => (
              <div key={label}>
                <label className="block text-xs text-zinc-500 mb-1.5">{label}</label>
                <input
                  type="date" value={val}
                  onChange={(e) => setter(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            ))}
          </div>

          {/* Submit */}
          <button
            type="submit" disabled={loading || !ticker}
            className="relative w-full overflow-hidden rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
            style={{ background: loading ? "#1e1b4b" : "linear-gradient(135deg, #4f46e5, #6366f1)" }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>Run Detection <span className="text-indigo-300">→</span></>
              )}
            </span>
            {!loading && (
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity" />
            )}
          </button>
        </form>
      </div>

      {/* Legend card */}
      <div className="glass rounded-2xl p-5">
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono mb-3">Regime Legend</p>
        <div className="flex flex-col gap-3">
          {REGIMES.map(({ name, color, desc }) => (
            <div key={name} className="flex items-center gap-3">
              <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <div>
                <p className="text-xs font-semibold text-white">{name}</p>
                <p className="text-xs text-zinc-600">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
