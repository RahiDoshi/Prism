import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useProject } from "../../api/hooks/projects";
import { useProjectComments, usePostComment, useDeleteComment } from "../../api/hooks/community";
import { useAuth } from "../../auth/AuthContext";
import { ApiError } from "../../api/client";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorMessage } from "../../components/ErrorMessage";
import { DateTime } from "../../lib/datetime";
import { isSafeUrl } from "../../lib/url";

const MAX_COMMENT_LENGTH = 2000;

function relativeTime(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function CommentsSection({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const commentsQuery = useProjectComments(projectId);
  const postComment = usePostComment(projectId);
  const deleteComment = useDeleteComment(projectId);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handlePost() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setError(null);
    try {
      await postComment.mutateAsync(trimmed);
      setBody("");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "duplicate_comment") setError("You already posted this comment recently.");
        else if (err.status === 429) setError("Too many comments. Please wait a moment.");
        else setError(err.message);
      } else {
        setError("Something went wrong.");
      }
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await deleteComment.mutateAsync(commentId);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    }
  }

  if (commentsQuery.isLoading) return <p className="text-df-dim">Loading comments…</p>;
  if (commentsQuery.isError) return <ErrorMessage error={commentsQuery.error} />;
  const comments = commentsQuery.data ?? [];

  return (
    <Card title="Comments">
      {comments.length === 0 ? (
        <EmptyState title="No comments yet" description="Be the first to comment." />
      ) : (
        <ul className="mb-4 space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded border border-slate-100 px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-medium text-df-text">{c.author.name}</span>
                  <span className="ml-2 text-xs text-df-dim" title={new Date(c.createdAt).toISOString()}>
                    {relativeTime(c.createdAt)}
                  </span>
                </div>
                {user && user.id === c.author.id ? (
                  <button
                    type="button"
                    className="text-xs text-df-pink hover:text-df-cyan transition-colors font-mono"
                    onClick={() => void handleDelete(c.id)}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-df-text">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      {user ? (
        <div className="space-y-2">
          <label className="block">
            <span className="text-sm font-medium text-df-text">Add a comment</span>
            <textarea
              className="mt-1 w-full rounded border border-white/20 bg-white/5 backdrop-blur-md text-df-text placeholder-white/50 px-3 py-2 text-sm shadow-[0_4px_30px_rgba(0,0,0,0.1)] focus:bg-white/10 focus:border-df-cyan focus:outline-none focus:ring-1 focus:ring-df-cyan"
              rows={3}
              maxLength={MAX_COMMENT_LENGTH}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a comment…"
            />
          </label>
          <div className="flex items-center justify-between">
            <span className="text-xs text-df-dim">
              {body.length} / {MAX_COMMENT_LENGTH}
            </span>
            <Button
              disabled={body.trim().length === 0 || postComment.isPending}
              onClick={() => void handlePost()}
            >
              {postComment.isPending ? "Posting…" : "Post comment"}
            </Button>
          </div>
          {error ? (
            <p className="rounded border border-red-200 bg-df-panel px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-df-dim">
          <Link to="/login" className="text-df-pink hover:text-df-cyan transition-colors font-mono">Log in</Link> to comment.
        </p>
      )}
    </Card>
  );
}

export function ProjectPage() {
  const { projectId } = useParams();
  const projectQuery = useProject(projectId);

  if (projectQuery.isLoading) return <p className="text-df-dim">Loading project…</p>;
  if (projectQuery.isError) return <ErrorMessage error={projectQuery.error} />;
  const project = projectQuery.data?.project;
  if (!project) return <EmptyState title="Project not found" />;

  return (
    <div className="space-y-6">
      <div className="border-b border-df-border/80 pb-4 space-y-2">
        <Link to={`/events/${project.eventId}`} className="inline-flex items-center gap-1.5 text-xs text-df-pink hover:text-df-cyan transition-colors font-mono font-bold uppercase tracking-wider">
          &larr; Back to Event
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <h1 className="text-3xl font-bold text-white font-display">{project.title}</h1>
          <div className="flex items-center gap-2">
            {project.trackName ? (
              <span className="px-3 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider bg-df-cyan/10 text-df-cyan border border-df-cyan/30">
                {project.trackName}
              </span>
            ) : null}
            <span className={`px-3 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider ${project.status === 'SUBMITTED' ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50' : 'bg-amber-950/90 text-amber-300 border border-amber-500/50'}`}>
              {project.status}
            </span>
          </div>
        </div>
        <p className="text-sm font-mono text-df-dim flex items-center gap-2">
          <span>Team: <strong className="text-white font-semibold">{project.teamName}</strong></span>
        </p>
      </div>

      <Card title="Project Summary">
        <p className="whitespace-pre-wrap text-df-text/90 leading-relaxed font-sans">{project.summary || "No summary provided."}</p>
      </Card>

      <Card title="Project Submissions & Links">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-lg bg-df-bg/80 border border-df-border flex flex-col justify-between">
            <span className="text-xs font-mono font-bold text-df-dim uppercase tracking-wider">Repository</span>
            <div className="mt-2 text-sm font-mono truncate">
              {isSafeUrl(project.repoUrl) ? (
                <a className="text-df-pink hover:text-df-cyan transition-colors font-semibold" href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                  View Source Code &rarr;
                </a>
              ) : (
                <span className="text-df-dim">—</span>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-df-bg/80 border border-df-border flex flex-col justify-between">
            <span className="text-xs font-mono font-bold text-df-dim uppercase tracking-wider">Demo / Build</span>
            <div className="mt-2 text-sm font-mono truncate">
              {isSafeUrl(project.demoUrl) ? (
                <a className="text-df-pink hover:text-df-cyan transition-colors font-semibold" href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                  Live Demo Link &rarr;
                </a>
              ) : (
                <span className="text-df-dim">—</span>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-df-bg/80 border border-df-border flex flex-col justify-between">
            <span className="text-xs font-mono font-bold text-df-dim uppercase tracking-wider">Submitted Date</span>
            <div className="mt-2 text-sm font-mono font-semibold text-white">
              <DateTime value={project.submittedAt} />
            </div>
          </div>
        </div>
      </Card>
      {project.status === "SUBMITTED" ? <CommentsSection projectId={project.id} /> : null}
    </div>
  );
}
