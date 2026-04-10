import { useState } from "react";
import { trainModel, fetchRegimes, fetchStrategy } from "../services/api";
import InputPanel     from "../components/InputPanel";
import PriceChart     from "../components/PriceChart";
import RegimeTimeline from "../components/RegimeTimeline";
import StrategyChart  from "../components/StrategyChart";
import LoadingSpinner from "../components/LoadingSpinner";

const STEPS = [
  { key: "train",    label: "Training HMM model",         pct: 33 },
  { key: "regimes",  label: "Fetching regime labels",      pct: 66 },
  { key: "strategy", label: "Computing strategy returns",  pct: 90 },
];

export default function Dashboard() {
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [regimes,     setRegimes]     = useState(null);
  const [performance, setPerformance] = useState(null);
  const [ticker,      setTicker]      = useState(null);
  const [stepIdx,     setStepIdx]     = useState(0);

  const handleSubmit = async ({ ticker, start, end }) => {
    setLoading(true);
    setError(null);
    setRegimes(null);
    setPerformance(null);
    setTicker(ticker);
    setStepIdx(0);

    try {
      setStepIdx(0); await trainModel(ticker, start, end);
      setStepIdx(1);
      const regRes = await fetchRegimes(ticker);
      setRegimes(regRes.data.regimes);
      setStepIdx(2);
      const strRes = await fetchStrategy(ticker);
      setPerformance(strRes.data.performance);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const currentStep = STEPS[stepIdx];

  return (
    <div className="min-h-screen bg-black">
      {/* Top nav */}
      <nav className="border-b border-zinc-900 px-6 py-3 flex items-center justify-between sticky top-0 z-50" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold">M</div>
          <div>
            <span className="text-sm font-semibold text-white">MarketRegime</span>
            <span className="text-zinc-700 mx-2 text-xs">·</span>
            <span className="text-xs text-zinc-600">HMM Detection</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {ticker && !loading && (
            <span className="text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-1 rounded-full">
              {ticker}
            </span>
          )}
          {loading && (
            <div className="flex items-center gap-2">
              <div className="h-1 w-24 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                  style={{ width: `${currentStep.pct}%` }}
                />
              </div>
              <span className="text-xs text-zinc-600 font-mono">{currentStep.pct}%</span>
            </div>
          )}
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="API connected" />
        </div>
      </nav>

      <div className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <InputPanel onSubmit={handleSubmit} loading={loading} />
          </aside>

          {/* Main */}
          <main className="lg:col-span-3 flex flex-col gap-5">

            {/* Error */}
            {error && (
              <div className="rounded-2xl px-5 py-4 text-sm flex items-start gap-3"
                style={{ background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231,76,60,0.2)' }}>
                <span className="text-red-500 mt-0.5">✕</span>
                <div>
                  <p className="text-red-400 font-semibold text-xs uppercase tracking-wider mb-1">Error</p>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="glass rounded-2xl">
                <LoadingSpinner message={currentStep.label} />
              </div>
            )}

            {/* Empty state */}
            {!loading && !regimes && !error && (
              <div className="glass gradient-border rounded-2xl flex flex-col items-center justify-center py-28 text-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl mb-5">
                  📊
                </div>
                <p className="text-white font-semibold mb-2">Ready to Analyse</p>
                <p className="text-zinc-600 text-sm max-w-xs leading-relaxed">
                  Select a ticker and date range, then click{" "}
                  <span className="text-indigo-400">Run Detection</span> to detect market regimes.
                </p>
                <div className="flex gap-4 mt-8">
                  {["Bull", "Bear", "Sideways"].map((r, i) => (
                    <div key={r} className="flex items-center gap-1.5 text-xs text-zinc-600">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ["#2ecc71","#e74c3c","#f39c12"][i] }} />
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {!loading && regimes && (
              <>
                <PriceChart     regimes={regimes} ticker={ticker} />
                <RegimeTimeline regimes={regimes} />
                <StrategyChart  performance={performance} />
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
