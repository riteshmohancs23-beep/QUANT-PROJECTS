import { useState, useRef, useEffect } from "react";
import { TICKER_DB, TYPE_COLOR } from "../data/tickers";

function search(query) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return TICKER_DB.filter(
    (t) =>
      t.symbol.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.exchange.toLowerCase().includes(q) ||
      t.type.toLowerCase().includes(q)
  ).slice(0, 8);
}

export default function TickerSearch({ onSelect }) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [focused, setFocused] = useState(false);
  const [active,  setActive]  = useState(-1);
  const inputRef  = useRef(null);
  const listRef   = useRef(null);

  useEffect(() => {
    setResults(search(query));
    setActive(-1);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!listRef.current?.contains(e.target) && !inputRef.current?.contains(e.target))
        setFocused(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKey = (e) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter" && active >= 0) { pick(results[active]); }
    if (e.key === "Escape") { setFocused(false); setQuery(""); }
  };

  const pick = (ticker) => {
    onSelect(ticker.symbol);
    setQuery("");
    setFocused(false);
    setResults([]);
  };

  const showDropdown = focused && results.length > 0;

  return (
    <div className="relative">
      <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono mb-2">Search Ticker</p>

      {/* Search input */}
      <div className={`flex items-center gap-2 bg-zinc-950 border rounded-xl px-3 py-2.5 transition-colors ${
        focused ? "border-indigo-500" : "border-zinc-800"
      }`}>
        <svg className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKey}
          placeholder="Search stocks, ETFs, crypto…"
          className="flex-1 bg-transparent text-white text-xs font-mono focus:outline-none placeholder-zinc-700"
        />
        {query && (
          <button onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="text-zinc-600 hover:text-zinc-400 transition-colors text-xs">✕</button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1.5 rounded-xl overflow-hidden shadow-2xl"
          style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {results.map((t, i) => {
            const tc = TYPE_COLOR[t.type] || TYPE_COLOR.Stock;
            return (
              <button
                key={t.symbol}
                onMouseDown={() => pick(t)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  i === active ? "bg-zinc-900" : "hover:bg-zinc-900/60"
                } ${i !== results.length - 1 ? "border-b border-zinc-900" : ""}`}
              >
                {/* Symbol */}
                <span className="font-mono font-semibold text-white text-xs w-24 flex-shrink-0 truncate">
                  {t.symbol}
                </span>
                {/* Name */}
                <span className="text-zinc-400 text-xs flex-1 truncate">{t.name}</span>
                {/* Type badge */}
                <span
                  className="text-xs px-1.5 py-0.5 rounded-md font-mono flex-shrink-0"
                  style={{ backgroundColor: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}
                >
                  {t.type}
                </span>
                {/* Exchange */}
                <span className="text-zinc-700 text-xs font-mono flex-shrink-0 w-14 text-right truncate">
                  {t.exchange}
                </span>
              </button>
            );
          })}
          <div className="px-3 py-1.5 border-t border-zinc-900">
            <p className="text-zinc-700 text-xs font-mono">↑↓ navigate · Enter select · Esc close</p>
          </div>
        </div>
      )}
    </div>
  );
}
