import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../../api/client";
import {
  useEventCertificates,
  useIssueCertificates,
  useRevokeRecord,
  RecordItem,
} from "../../../api/hooks/records";

interface Props {
  eventId: string;
}

export function RecordsTab({ eventId }: Props) {
  const certificatesQuery = useEventCertificates(eventId);
  const issueCertificatesMutation = useIssueCertificates(eventId);
  const revokeRecordMutation = useRevokeRecord();

  const [revokingRecordId, setRevokingRecordId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState("");

  const handleIssueCertificates = () => {
    issueCertificatesMutation.mutate(undefined, {
      onSuccess: (data) => {
        alert(`Successfully issued ${data.issuedCount} certificate(s)!`);
      },
      onError: (err) => {
        alert(`Error issuing certificates: ${err.message}`);
      },
    });
  };

  const handleConfirmRevoke = (recordId: string) => {
    if (!revokeReason.trim()) {
      alert("Please provide a reason for revoking this certificate.");
      return;
    }
    revokeRecordMutation.mutate(
      { recordId, reason: revokeReason },
      {
        onSuccess: () => {
          setRevokingRecordId(null);
          setRevokeReason("");
        },
        onError: (err) => {
          alert(`Error revoking record: ${err.message}`);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Verifiable Certificates & Records
            </h2>
            <p className="mt-1 text-sm text-white/70">
              Issue cryptographic Ed25519 signed certificates to winners, participants, and judges.
              Certificates become available after results are published.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleIssueCertificates}
              disabled={issueCertificatesMutation.isPending}
              className="rounded-md bg-df-pink px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {issueCertificatesMutation.isPending ? "Issuing..." : "Issue Certificates Now"}
            </button>
            <button
              type="button"
              onClick={() => {
                void apiRequest<{ kid: string }>("/api/admin/records/keys/rotate", {
                  method: "POST",
                })
                  .then((body) => {
                    alert(`Signing key rotated. New kid: ${body.kid}`);
                  })
                  .catch((err: Error) => {
                    alert(err.message || "Key rotation failed (admin only).");
                  });
              }}
              className="rounded-md border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/5 transition-colors"
            >
              Rotate signing key
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-4">
          Issued Certificates ({certificatesQuery.data?.certificates.length || 0})
        </h3>

        {certificatesQuery.isLoading ? (
          <p className="py-4 text-sm text-white/50">Loading certificates...</p>
        ) : certificatesQuery.data?.certificates.length === 0 ? (
          <p className="py-4 text-sm text-white/50">
            No certificates issued for this event yet. Click "Issue Certificates Now" above.
          </p>
        ) : (
          <div className="divide-y divide-white/10 border-t border-white/10">
            {certificatesQuery.data?.certificates.map((rec: RecordItem) => (
              <div key={rec.id} className="py-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">
                        {rec.type.replace("_", " ").toUpperCase()}
                      </span>
                      {rec.revokedAt ? (
                        <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-400 font-medium">
                          Revoked
                        </span>
                      ) : (
                        <span className="rounded bg-green-500/20 px-2 py-0.5 text-xs text-green-400 font-medium">
                          Valid
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-white/50 mt-1">ID: {rec.id}</p>
                    <p className="text-xs text-white/50 mt-0.5">
                      Issued: {new Date(rec.issuedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      to={`/certificates/${rec.id}`}
                      className="text-xs font-medium text-df-pink hover:text-df-cyan transition-colors font-mono"
                    >
                      View Certificate
                    </Link>
                    <Link
                      to={`/verify/${rec.id}`}
                      className="text-xs font-medium text-white/60 hover:text-df-cyan transition-colors font-mono"
                    >
                      Verify
                    </Link>
                    {!rec.revokedAt && (
                      <button
                        type="button"
                        className="text-xs font-medium text-df-pink hover:text-df-cyan transition-colors font-mono"
                        onClick={() => {
                          setRevokingRecordId(rec.id);
                          setRevokeReason("");
                        }}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>

                {rec.revokedAt && (
                  <div className="rounded bg-white/5 border border-white/10 p-2 text-xs text-white/70">
                    <strong className="text-white">Revoked Reason:</strong> {rec.revokedReason} (at{" "}
                    {new Date(rec.revokedAt).toLocaleString()})
                  </div>
                )}

                {revokingRecordId === rec.id && (
                  <div className="mt-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 space-y-2">
                    <label className="block text-xs font-semibold text-red-400">
                      Reason for Revocation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Disqualification, Administrative Correction"
                      className="w-full rounded border border-white/20 bg-white/5 text-white placeholder-white/50 px-3 py-1.5 text-xs focus:outline-none focus:border-red-400"
                      value={revokeReason}
                      onChange={(e) => setRevokeReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                        onClick={() => handleConfirmRevoke(rec.id)}
                      >
                        Confirm Revocation
                      </button>
                      <button
                        type="button"
                        className="rounded border border-white/20 bg-transparent px-3 py-1 text-xs font-medium text-white/90 hover:bg-white/5 transition-colors"
                        onClick={() => setRevokingRecordId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
