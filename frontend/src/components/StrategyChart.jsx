import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl p-3 text-xs shadow-2xl border border-zinc-800">
      <p className="text-zinc-500 font-mono mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-zinc-400">{p.name}</span>
          </div>
          <span className="font-semibold font-mono" style={{ color: p.value >= 0 ? "#2ecc71" : "#e74c3c" }}>
            {p.value >= 0 ? "+" : ""}{(p.value * 100).toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
};

export default function StrategyChart({ performance }) {
  if (!performance?.length) return null;

  const finalBnH      = performance[performance.length - 1].buy_and_hold_return;
  const finalStrategy = performance[performance.length - 1].strategy_return;
  const outperforms   = finalStrategy > finalBnH;

  return (
    <div className="glass gradient-border rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono mb-1">Backtest</p>
          <h2 className="text-base font-semibold text-white">Strategy vs Buy &amp; Hold</h2>
        </div>
        {/* Return cards */}
        <div className="flex gap-3">
          {[
            { label: "Buy & Hold", value: finalBnH, color: "#6366f1" },
            { label: "HMM Strategy", value: finalStrategy, color: "#2ecc71" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-right rounded-xl px-4 py-2.5" style={{ backgroundColor: color + "0f", border: `1px solid ${color}20` }}>
              <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
              <p className="text-base font-bold font-mono" style={{ color }}>
                {value >= 0 ? "+" : ""}{(value * 100).toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Outperformance badge */}
      <div className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full mb-5 font-medium ${
        outperforms ? "bg-emerald-950 text-emerald-400 border border-emerald-900" : "bg-zinc-900 text-zinc-500 border border-zinc-800"
      }`}>
        <span>{outperforms ? "▲" : "▼"}</span>
        {outperforms
          ? `Strategy outperforms by ${((finalStrategy - finalBnH) * 100).toFixed(1)}%`
          : `Buy & Hold leads by ${((finalBnH - finalStrategy) * 100).toFixed(1)}%`}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={performance} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="1 4" stroke="#18181b" vertical={false} />
          <XAxis
            dataKey="date" tick={{ fill: "#52525b", fontSize: 10, fontFamily: 'JetBrains Mono' }}
            tickFormatter={(d) => d?.slice(0, 7)} interval="preserveStartEnd"
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fill: "#52525b", fontSize: 10, fontFamily: 'JetBrains Mono' }}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            width={45} axisLine={false} tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#3f3f46", strokeWidth: 1 }} />
          <ReferenceLine y={0} stroke="#27272a" strokeDasharray="4 4" />
          <Line type="monotone" dataKey="buy_and_hold_return" name="Buy & Hold"
            stroke="#6366f1" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="strategy_return" name="HMM Strategy"
            stroke="#2ecc71" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>

      <p className="text-xs text-zinc-700 mt-4 font-mono">
        * Invested only during Bull regime. No transaction costs or slippage modelled.
      </p>
    </div>
  );
}
