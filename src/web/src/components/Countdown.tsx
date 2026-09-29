import { useEffect, useState } from "react";

function formatRemaining(ms: number): string {
  if (ms <= 0) return "Closed";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function Countdown({ to, label }: { to: string; label?: string }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remainingText = formatRemaining(target - now);
  const isClosed = remainingText === "Closed";

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-df-bg/80 border border-df-cyan/30 text-sm font-mono">
      <span className={`w-2 h-2 rounded-full ${isClosed ? "bg-rose-500" : "bg-df-cyan"}`} />
      {label ? <span className="font-semibold text-df-dim uppercase text-xs tracking-wider">{label}:</span> : null}
      <span className={`font-bold ${isClosed ? "text-rose-400" : "text-df-cyan"}`}>{remainingText}</span>
    </div>
  );
}
