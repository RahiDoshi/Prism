import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button } from "./Button";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-[12px] font-semibold transition-all uppercase tracking-wide flex items-center gap-1 ${isActive ? "text-df-cyan" : "text-white/70 hover:text-white"}`;

export function Layout() {
  const { user, isAuthenticated, isLoading, logout, hasPlatformRole, hasEventRole } = useAuth();
  const navigate = useNavigate();

  async function onLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col bg-df-bg text-df-text font-sans overflow-x-hidden relative">
      <header className="fixed top-0 inset-x-0 z-50 bg-df-bg/95 backdrop-blur-md border-b border-df-border/80 px-6 py-3 shadow-2xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4">

          {/* Left Logo with cyan icon badge */}
          <div className="flex items-center">
            <Link to="/" className="text-lg font-bold text-white tracking-wider flex items-center gap-2.5 group">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-df-cyan/10 text-df-cyan border border-df-cyan/30 group-hover:border-df-cyan transition-colors text-xs font-mono">
                ⚡
              </span>
              <span className="font-display uppercase tracking-widest text-white group-hover:text-df-cyan transition-colors">
                CODECLASH
              </span>
            </Link>
          </div>

          {/* Right Navigation & Auth Controls */}
          <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center gap-4 sm:gap-6">
              <NavLink to="/" end className={navLinkClass}>
                Home
              </NavLink>
              <NavLink to="/events" className={navLinkClass}>
                Events
              </NavLink>
              <NavLink to="/gallery" className={navLinkClass}>
                Gallery
              </NavLink>
              {isAuthenticated && user && (
                <>
                  {(hasEventRole("PARTICIPANT") || user.platformRole === "USER") && (
                    <NavLink to="/teams" className={navLinkClass}>
                      My teams
                    </NavLink>
                  )}
                  <NavLink to="/certificates" className={navLinkClass}>
                    Certificates
                  </NavLink>
                  {hasEventRole("JUDGE") && (
                    <NavLink to="/judge" className={navLinkClass}>
                      Judge
                    </NavLink>
                  )}
                  {hasPlatformRole("ORGANIZER", "ADMIN") && (
                    <NavLink to="/organize" className={navLinkClass}>
                      Organizer
                    </NavLink>
                  )}
                  {user.platformRole === "ADMIN" && (
                    <NavLink to="/admin" className={navLinkClass}>
                      Admin
                    </NavLink>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-3 border-l border-white/10 pl-4 sm:pl-6">
              {isLoading ? (
                <span className="text-sm text-white/70">…</span>
              ) : isAuthenticated && user ? (
                <>
                  <span className="hidden md:inline font-mono text-[11px] text-white/90 uppercase tracking-[0.1em]">[{user.name}]</span>
                  <Button type="button" variant="secondary" className="!rounded-md !px-4 !py-1.5 !text-[11px] !bg-df-pink text-white border-none hover:!bg-opacity-80 tracking-wider font-bold" onClick={() => void onLogout()}>
                    LOG OUT
                  </Button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    className="text-[12px] font-semibold uppercase tracking-wide text-white/90 hover:text-white transition-colors px-2 py-1"
                  >
                    LOGIN
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="text-[11px] font-bold px-4 py-2 rounded-md bg-df-pink text-white hover:opacity-90 transition-opacity uppercase tracking-wide shadow-md"
                  >
                    REGISTER
                  </NavLink>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>
      <main className="flex-1 w-full mx-auto max-w-7xl px-6 pt-24 pb-12">
        <Outlet />
      </main>
      <footer className="border-t border-df-border mt-auto w-full">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-6 py-6 font-mono text-[10px] text-df-dimmer uppercase tracking-[0.2em]">
          <span>DOGFOOD Portal</span>
          <span>Build the platform that will judge you</span>
        </div>
      </footer>
    </div>
  );
}
