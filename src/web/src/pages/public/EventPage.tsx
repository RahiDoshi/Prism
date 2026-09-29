import { Link, useParams } from "react-router-dom";
import { useEvent } from "../../api/hooks/events";
import { useAuth } from "../../auth/AuthContext";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Countdown } from "../../components/Countdown";
import { EmptyState } from "../../components/EmptyState";
import { ErrorMessage } from "../../components/ErrorMessage";
import { DateTime } from "../../lib/datetime";

function VotingCard({ eventId, votingOpen, votingClose }: { eventId: string; votingOpen: string; votingClose: string }) {
  const now = new Date();
  const opens = new Date(votingOpen);
  const closes = new Date(votingClose);
  const isOpen = now >= opens && now < closes;
  const isClosed = now >= closes;

  return (
    <Card title="Community Voting Timeline">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-df-bg/80 border border-indigo-500/20">
            <div className="text-xs font-bold font-mono text-indigo-400 uppercase tracking-wider">Voting Opens</div>
            <div className="text-sm font-mono font-semibold text-white mt-1">
              <DateTime value={votingOpen} />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-df-bg/80 border border-indigo-500/20">
            <div className="text-xs font-bold font-mono text-indigo-400 uppercase tracking-wider">Voting Closes</div>
            <div className="text-sm font-mono font-semibold text-white mt-1">
              <DateTime value={votingClose} />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-df-border/60 flex flex-wrap items-center justify-between gap-3">
          {isOpen ? (
            <>
              <Countdown to={votingClose} label="Voting closes in" />
              <Link to={`/events/${eventId}/vote`}>
                <Button>Vote Now</Button>
              </Link>
            </>
          ) : isClosed ? (
            <>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="font-semibold text-df-text text-sm">Voting has concluded</span>
              </div>
              <Link to={`/events/${eventId}/community-results`}>
                <Button variant="secondary">View Community Results</Button>
              </Link>
            </>
          ) : (
            <div className="text-sm text-df-dim font-mono">
              Voting opens on <span className="text-white font-semibold"><DateTime value={votingOpen} /></span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function EventPage() {
  const { eventId } = useParams();
  const { isAuthenticated, hasEventRole, hasPlatformRole } = useAuth();
  const eventQuery = useEvent(eventId);

  if (eventQuery.isLoading) return <p className="text-df-dim font-mono animate-pulse">Loading event details…</p>;
  if (eventQuery.isError) return <ErrorMessage error={eventQuery.error} />;
  const event = eventQuery.data?.event;
  if (!event) return <EmptyState title="Event not found" />;

  const canOrganize = hasPlatformRole("ADMIN") || hasEventRole("ORGANIZER", event.id);
  const hasVoting = Boolean(event.votingOpen && event.votingClose);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-df-border/80 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white font-display tracking-tight">{event.name}</h1>
            <Badge>{event.phase}</Badge>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Link to={`/gallery?eventId=${event.id}`}>
            <Button variant="secondary">Gallery</Button>
          </Link>
          {isAuthenticated ? (
            <Link to={`/events/${event.id}/team/new`}>
              <Button>Create Team</Button>
            </Link>
          ) : null}
          {event.resultsPublishedAt ? (
            <Link to={`/events/${event.id}/results`}>
              <Button variant="secondary">Results</Button>
            </Link>
          ) : null}
          {canOrganize ? (
            <Link to={`/organize/${event.id}`}>
              <Button variant="secondary">Manage Event</Button>
            </Link>
          ) : null}
        </div>
      </div>

      {/* Timeline & Important Dates Card */}
      <Card title="Important Event Dates">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3.5 p-3.5 rounded-lg bg-df-bg/80 border border-emerald-500/30">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 2 2 0 002-2V7a2 2 2 2 0 00-2-2H5a2 2 2 2 0 00-2 2v12a2 2 2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-bold tracking-wider text-emerald-400 uppercase font-mono">Submissions Open</div>
              <div className="text-sm font-mono font-bold text-white mt-0.5">
                <DateTime value={event.submissionsOpen} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-lg bg-df-bg/80 border border-rose-500/30">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-bold tracking-wider text-rose-400 uppercase font-mono">Submission Deadline</div>
              <div className="text-sm font-mono font-bold text-white mt-0.5">
                <DateTime value={event.submissionsClose} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-df-border/60 flex items-center justify-between">
          <Countdown to={event.submissionsClose} label="Submission Deadline In" />
        </div>
      </Card>

      {/* Event Overview */}
      <Card title="About Event">
        <p className="whitespace-pre-wrap text-df-text/90 leading-relaxed font-sans">{event.description || "No description provided for this event."}</p>
      </Card>

      {/* Voting Timeline (if present) */}
      {hasVoting ? (
        <VotingCard eventId={event.id} votingOpen={event.votingOpen!} votingClose={event.votingClose!} />
      ) : null}

      {/* Event Tracks */}
      <Card title="Event Tracks">
        {event.tracks.length === 0 ? (
          <EmptyState title="No tracks specified" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {event.tracks.map((track) => (
              <div key={track.id} className="p-3.5 rounded-lg bg-df-bg/60 border border-df-border/80">
                <span className="font-bold text-df-cyan font-mono">{track.name}</span>
                {track.description ? (
                  <p className="text-xs text-df-dim mt-1 font-sans">{track.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Event Prizes */}
      <Card title="Event Prizes">
        {event.prizes.length === 0 ? (
          <EmptyState title="No prizes listed" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {event.prizes.map((prize) => (
              <div key={prize.id} className="p-3.5 rounded-lg bg-df-bg/60 border border-df-pink/30 flex items-center justify-between">
                <span className="font-bold text-white font-mono">{prize.name}</span>
                {prize.value ? <span className="text-xs font-mono px-2 py-0.5 rounded bg-df-pink/20 text-df-pink border border-df-pink/40">{prize.value}</span> : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
