import { Link } from "react-router-dom";
import { useEvents } from "../../api/hooks/events";
import { RequireRole } from "../../auth/RequireRole";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
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

function OrganizerHomeContent() {
  const eventsQuery = useEvents();

  if (eventsQuery.isLoading) return <p className="text-df-dim font-mono animate-pulse">Loading events…</p>;
  if (eventsQuery.isError) return <ErrorMessage error={eventsQuery.error} />;

  const events = eventsQuery.data?.events ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 border-b border-df-border/80 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display uppercase tracking-wider text-white">Organize Events</h1>
          <p className="text-xs font-mono text-df-dim mt-0.5">Manage event lifecycle, rubrics, judge assignments, and results</p>
        </div>
        <Link to="/organize/new">
          <Button>New Event</Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <EmptyState title="No events" description="Create an event to get started." />
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card key={event.id}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/organize/${event.id}`}
                      className="text-xl font-bold text-df-pink hover:text-df-cyan transition-colors font-mono"
                    >
                      {event.name}
                    </Link>
                    <Badge tone={phaseTone(event.phase)}>{event.phase}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-df-dim">
                    <span>Deadline: <span className="text-white font-semibold"><DateTime value={event.submissionsClose} /></span></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/organize/${event.id}`}>
                    <Button variant="secondary">Manage Settings</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function OrganizerHomePage() {
  return (
    <RequireRole platformRoles={["ORGANIZER", "ADMIN"]}>
      <OrganizerHomeContent />
    </RequireRole>
  );
}
