const REGIME_COLOR = { Bull: "#2ecc71", Bear: "#e74c3c", Sideways: "#f39c12" };

function rle(regimes) {
  if (!regimes.length) return [];
  const runs = [];
  let cur = { name: regimes[0].regime_name, count: 1 };
  for (let i = 1; i < regimes.length; i++) {
    if (regimes[i].regime_name === cur.name) cur.count++;
    else { runs.push(cur); cur = { name: regimes[i].regime_name, count: 1 }; }
  }
  runs.push(cur);
  return runs;
}

export default function RegimeTimeline({ regimes }) {
  if (!regimes?.length) return null;
  const runs  = rle(regimes);
  const total = regimes.length;
  const counts = regimes.reduce((acc, r) => {
    acc[r.regime_name] = (acc[r.regime_name] || 0) + 1;
    return acc;
  }, {});
  const latest = regimes[regimes.length - 1].regime_name;

  return (
    <div className="glass gradient-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono mb-1">Timeline</p>
          <h2 className="text-base font-semibold text-white">Regime Distribution</h2>
        </div>
        <div
          className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
          style={{ backgroundColor: REGIME_COLOR[latest] + "18", color: REGIME_COLOR[latest], border: `1px solid ${REGIME_COLOR[latest]}30` }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: REGIME_COLOR[latest] }} />
          Current: {latest}
        </div>
      </div>

      {/* Timeline bar */}
      <div className="flex w-full h-3 rounded-full overflow-hidden mb-6 bg-zinc-950">
        {runs.map((run, i) => (
          <div
            key={i}
            title={`${run.name}: ${run.count} days`}
            style={{ width: `${(run.count / total) * 100}%`, backgroundColor: REGIME_COLOR[run.name] }}
            className="transition-opacity hover:opacity-100 opacity-75"
          />
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(REGIME_COLOR).map(([name, color]) => {
          const count = counts[name] || 0;
          const pct   = ((count / total) * 100).toFixed(1);
          return (
            <div
              key={name}
              className="rounded-xl p-4 flex flex-col gap-2"
              style={{ backgroundColor: color + "0a", border: `1px solid ${color}18` }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs font-semibold" style={{ color }}>{name}</span>
              </div>
              <p className="text-2xl font-bold text-white">{pct}<span className="text-sm text-zinc-600 font-normal">%</span></p>
              <p className="text-xs text-zinc-600 font-mono">{count} days</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
