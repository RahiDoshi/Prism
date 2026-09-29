type BadgeProps = {
  children: string;
  tone?: "slate" | "indigo" | "green" | "amber" | "red";
};

const tones = {
  slate: "bg-slate-900/90 text-slate-300 border border-slate-700/80",
  indigo: "bg-indigo-950/90 text-indigo-300 border border-indigo-500/50",
  green: "bg-emerald-950/90 text-emerald-300 border border-emerald-500/50",
  amber: "bg-amber-950/90 text-amber-300 border border-amber-500/50",
  red: "bg-rose-950/90 text-rose-300 border border-rose-500/50",
};

export function Badge({ children, tone = "slate" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-md ${tones[tone]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 animate-pulse" />
      {children}
    </span>
  );
}

