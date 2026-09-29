import { Link, useSearchParams } from "react-router-dom";
import { useEvents } from "../../api/hooks/events";
import { useGallery } from "../../api/hooks/projects";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorMessage } from "../../components/ErrorMessage";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";

export function GalleryPage() {
  const [params, setParams] = useSearchParams();
  const eventId = params.get("eventId") ?? "";
  const trackId = params.get("trackId") ?? "";
  const q = params.get("q") ?? "";

  const eventsQuery = useEvents();
  const galleryQuery = useGallery({
    eventId: eventId || undefined,
    trackId: trackId || undefined,
    q: q || undefined,
    pageSize: 100,
  });

  const selectedEvent = eventsQuery.data?.events.find((event) => event.id === eventId);
  const trackOptions = [
    { value: "", label: "All tracks" },
    ...(selectedEvent?.tracks.map((track) => ({ value: track.id, label: track.name })) ?? []),
  ];

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "eventId") next.delete("trackId");
    setParams(next);
  }

  const items = galleryQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-df-border/80 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-display uppercase tracking-wider text-white">Project Gallery</h1>
          <p className="text-sm text-df-dim mt-1 font-mono">Browse submitted hackathon projects, team solutions, and track entries</p>
        </div>
        <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-df-panel border border-df-border text-xs font-mono font-bold text-df-cyan">
          {items.length} {items.length === 1 ? 'Project' : 'Projects'} Found
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-df-panel border border-df-border/80 space-y-3">
        <div className="text-xs font-mono font-bold text-df-dim uppercase tracking-wider mb-2">Filter & Search Projects</div>
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            label="Search"
            value={q}
            onChange={(event) => update("q", event.target.value)}
            placeholder="Search by title or summary..."
          />
          <Select
            label="Event"
            value={eventId}
            onChange={(event) => update("eventId", event.target.value)}
            options={[
              { value: "", label: "All events" },
              ...(eventsQuery.data?.events.map((event) => ({
                value: event.id,
                label: event.name,
              })) ?? []),
            ]}
          />
          <Select
            label="Track"
            value={trackId}
            onChange={(event) => update("trackId", event.target.value)}
            options={trackOptions}
            disabled={!eventId}
          />
        </div>
      </div>

      {galleryQuery.isLoading ? <p className="text-df-dim font-mono animate-pulse">Loading gallery projects…</p> : null}
      {galleryQuery.isError ? <ErrorMessage error={galleryQuery.error} /> : null}

      {galleryQuery.data && items.length === 0 ? (
        <EmptyState title="No projects found" description="Try adjusting your search terms or filters." />
      ) : null}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((project) => (
          <Card key={project.id}>
            <div className="flex flex-col h-full justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Link
                    to={`/projects/${project.id}`}
                    className="text-lg font-bold text-df-pink hover:text-df-cyan transition-colors font-mono tracking-tight"
                  >
                    {project.title}
                  </Link>
                  {project.trackName ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-df-cyan/10 text-df-cyan border border-df-cyan/30">
                      {project.trackName}
                    </span>
                  ) : null}
                </div>

                <p className="text-sm text-df-text/90 leading-relaxed font-sans line-clamp-3">
                  {project.summary || "No project summary provided."}
                </p>
              </div>

              <div className="pt-3 border-t border-df-border/70 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-mono text-df-dim">
                  <span className="text-df-cyan">👥</span>
                  <span className="font-semibold text-white">{project.teamName ?? "Solo Member"}</span>
                </div>

                <Link
                  to={`/projects/${project.id}`}
                  className="inline-flex items-center gap-1 text-xs font-mono font-bold uppercase tracking-wider text-df-cyan hover:text-white px-3 py-1.5 rounded bg-df-bg border border-df-cyan/30 hover:border-df-cyan transition-all"
                >
                  View Project
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
