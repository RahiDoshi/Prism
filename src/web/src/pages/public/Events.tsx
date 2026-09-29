import { Link } from "react-router-dom";
import { useEvents } from "../../api/hooks/events";
import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorMessage } from "../../components/ErrorMessage";
import { DateTime } from "../../lib/datetime";

function phaseTone(phase: string): "slate" | "indigo" | "green" | "amber" | "red" {
  switch (phase) {
    case "submissions":
      return "green";
    case "judging":
      return "amber";
    case "results":
      return "indigo";
    case "upcoming":
      return "slate";
    default:
      return "slate";
  }
}

export function EventsPage() {
  const eventsQuery = useEvents();

  if (eventsQuery.isLoading) return <p className="text-df-dim font-mono animate-pulse">Loading events…</p>;
  if (eventsQuery.isError) return <ErrorMessage error={eventsQuery.error} />;

  const events = eventsQuery.data?.events ?? [];
  if (events.length === 0) {
    return <EmptyState title="No events yet" description="Published events will appear here." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-df-border/80 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-display uppercase tracking-wider text-white">Events</h1>
          <p className="text-sm text-df-dim mt-1 font-mono">Explore hackathons, submit projects, and view live judging results</p>
        </div>
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-df-panel border border-df-border text-xs font-mono text-df-cyan">
          {events.length} Active {events.length === 1 ? 'Event' : 'Events'}
        </div>
      </div>

      <div className="grid gap-6">
        {events.map((event) => {
          const hasVoting = Boolean(event.votingOpen && event.votingClose);

          return (
            <Card key={event.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-[260px]">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/events/${event.id}`}
                      className="text-xl font-bold text-df-pink hover:text-df-cyan transition-colors font-mono tracking-tight"
                    >
                      {event.name}
                    </Link>
                  </div>
                  <p className="text-sm text-df-text/80 line-clamp-2 leading-relaxed">{event.description || "No description provided."}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge tone={phaseTone(event.phase)}>{event.phase}</Badge>
                  <Link
                    to={`/events/${event.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-df-cyan hover:text-white px-3 py-1.5 rounded bg-df-bg border border-df-cyan/30 hover:border-df-cyan transition-all"
                  >
                    View Details
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Highlighted Key Dates & Details Section */}
              <div className={`mt-5 pt-4 border-t border-df-border/80 grid grid-cols-1 ${hasVoting ? 'md:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
                {/* Submissions Open Date Box */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-df-bg/80 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.05)]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 2 2 0 002-2V7a2 2 2 2 0 00-2-2H5a2 2 2 2 0 00-2 2v12a2 2 2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase font-mono">Submissions Open</div>
                    <div className="text-xs font-mono font-semibold text-white mt-0.5">
                      <DateTime value={event.submissionsOpen} />
                    </div>
                  </div>
                </div>

                {/* Submission Deadline Date Box */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-df-bg/80 border border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.05)]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold tracking-wider text-rose-400 uppercase font-mono">Submission Deadline</div>
                    <div className="text-xs font-mono font-semibold text-white mt-0.5">
                      <DateTime value={event.submissionsClose} />
                    </div>
                  </div>
                </div>

                {/* Community Voting Window Box (If Enabled) */}
                {hasVoting ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-df-bg/80 border border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.05)]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold tracking-wider text-indigo-400 uppercase font-mono">Voting Deadline</div>
                      <div className="text-xs font-mono font-semibold text-white mt-0.5">
                        <DateTime value={event.votingClose!} />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
