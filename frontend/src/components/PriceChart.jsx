import {
  ComposedChart, Line, XAxis, YAxis, Tooltip,
  ReferenceArea, ResponsiveContainer, CartesianGrid,
} from "recharts";

const REGIME_COLOR = { Bull: "#2ecc71", Bear: "#e74c3c", Sideways: "#f39c12" };

function buildSegments(regimes) {
  if (!regimes.length) return [];
  const segments = [];
  let start = regimes[0];
  for (let i = 1; i < regimes.length; i++) {
    if (regimes[i].regime_name !== start.regime_name) {
      segments.push({ ...start, endDate: regimes[i - 1].date });
      start = regimes[i];
    }
  }
  segments.push({ ...start, endDate: regimes[regimes.length - 1].date });
  return segments;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const regime = payload[0]?.payload?.regime_name;
  return (
    <div className="glass rounded-xl p-3 text-xs shadow-2xl border border-zinc-800">
      <p className="text-zinc-500 font-mono mb-1.5">{label}</p>
      <p className="text-white font-semibold text-sm">{Number(payload[0]?.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      {regime && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: REGIME_COLOR[regime] }} />
          <span style={{ color: REGIME_COLOR[regime] }} className="font-medium">{regime}</span>
        </div>
      )}
    </div>
  );
};

export default function PriceChart({ regimes, ticker }) {
  if (!regimes?.length) return null;
  const segments = buildSegments(regimes);
  const latest = regimes[regimes.length - 1];
  const latestColor = REGIME_COLOR[latest.regime_name];

  return (
    <div className="glass gradient-border rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono mb-1">Price Chart</p>
          <h2 className="text-base font-semibold text-white">Regime Overlay</h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Current regime badge */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: latestColor + "18", color: latestColor, border: `1px solid ${latestColor}30` }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: latestColor }} />
            {latest.regime_name}
          </div>
          {/* Legend dots */}
          <div className="flex items-center gap-2">
            {Object.entries(REGIME_COLOR).map(([name, color]) => (
              <div key={name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-zinc-600">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={regimes} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="1 4" stroke="#18181b" vertical={false} />
          <XAxis
            dataKey="date" tick={{ fill: "#52525b", fontSize: 10, fontFamily: 'JetBrains Mono' }}
            tickFormatter={(d) => d?.slice(0, 7)} interval="preserveStartEnd"
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fill: "#52525b", fontSize: 10, fontFamily: 'JetBrains Mono' }}
            tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toFixed(0)}
            width={45} axisLine={false} tickLine={false} domain={["auto", "auto"]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#3f3f46", strokeWidth: 1 }} />
          {segments.map((seg, i) => (
            <ReferenceArea key={i} x1={seg.date} x2={seg.endDate}
              fill={REGIME_COLOR[seg.regime_name]} fillOpacity={0.08} />
          ))}
          <Line type="monotone" dataKey="close" dot={false}
            stroke="#6366f1" strokeWidth={1.5} name="Close" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
