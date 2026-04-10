export default function LoadingSpinner({ message = "Processing..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border border-zinc-800" />
        <div className="absolute inset-0 rounded-full border-t border-indigo-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-t border-emerald-500 animate-spin" style={{ animationDuration: '0.6s', animationDirection: 'reverse' }} />
      </div>
      <p className="text-zinc-500 text-xs tracking-widest uppercase font-mono">{message}</p>
    </div>
  );
}
