import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <div className="relative min-h-[calc(100vh-180px)] flex flex-col items-center justify-center text-center px-4 py-12 overflow-hidden">
      {/* Background Layer: Clean Cyber Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#1B2540_1px,transparent_1px),linear-gradient(to_bottom,#1B2540_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_50%,#000_60%,transparent_100%)] opacity-25"
      />

      {/* Main Hero Container */}
      <div className="relative z-10 max-w-5xl flex flex-col items-center">
        
        {/* Top Tagline Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-df-panel border border-df-cyan/40 text-df-cyan text-xs font-mono font-semibold uppercase tracking-widest mb-8">
          <span className="w-2 h-2 rounded-full bg-df-cyan" />
          DOGFOOD 2026 HACKATHON PORTAL
        </div>

        {/* Hero Title */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-extrabold text-white tracking-tight font-display uppercase">
          PRISM
        </h1>
        
        {/* Hero Tagline */}
        <p className="mt-4 text-xl sm:text-2xl md:text-3xl text-df-pink font-mono font-bold tracking-[0.2em] uppercase">
          Build. Compete. Conquer.
        </p>

        <p className="mt-6 text-sm sm:text-base text-df-text/80 max-w-2xl font-sans leading-relaxed">
          The offline, trustworthy hackathon submission & judging platform. Built for high-stakes competition with deterministic scoring, judge isolation, and verifiable records.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 w-full max-w-lg">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
            <Link 
              to="/events" 
              className="w-full sm:w-1/2 text-center bg-df-pink hover:bg-df-pink/90 text-white font-bold text-sm px-7 py-3.5 rounded-md transition-colors uppercase tracking-wider font-mono shadow-md"
            >
              Start Building
            </Link>
            <Link 
              to="/gallery"
              className="w-full sm:w-1/2 text-center bg-df-panel text-white border border-df-cyan/40 font-bold text-sm px-7 py-3.5 rounded-md hover:bg-df-panel/80 hover:border-df-cyan transition-colors uppercase tracking-wider font-mono"
            >
              Explore Gallery
            </Link>
          </div>
        </div>

        {/* Platform Highlights Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-5 text-left w-full">
          <div className="p-5 rounded-xl bg-df-panel border border-df-border hover:border-df-cyan/40 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-df-cyan/10 text-df-cyan border border-df-cyan/30 flex items-center justify-center font-mono font-bold text-xs">
                01
              </div>
              <h3 className="font-bold text-white text-sm uppercase tracking-wide font-mono">Fully Offline</h3>
            </div>
            <p className="text-xs text-df-dim leading-relaxed font-sans">
              100% self-hosted Node/Postgres stack with zero external cloud dependencies or telemetry.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-df-panel border border-df-border hover:border-df-pink/40 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-df-pink/10 text-df-pink border border-df-pink/30 flex items-center justify-center font-mono font-bold text-xs">
                02
              </div>
              <h3 className="font-bold text-white text-sm uppercase tracking-wide font-mono">Judging Integrity</h3>
            </div>
            <p className="text-xs text-df-dim leading-relaxed font-sans">
              Z-score score normalization, complete judge isolation, and tamper-proof audit trails.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-df-panel border border-df-border hover:border-indigo-500/40 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-mono font-bold text-xs">
                03
              </div>
              <h3 className="font-bold text-white text-sm uppercase tracking-wide font-mono">Verifiable Records</h3>
            </div>
            <p className="text-xs text-df-dim leading-relaxed font-sans">
              Cryptographically signed certificate keys and open API integration tools built-in.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
