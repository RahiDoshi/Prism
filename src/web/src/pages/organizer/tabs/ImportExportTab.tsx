import { useState } from "react";
import { useImportJson, useImportCsvJudges, DryRunSummary } from "../../../api/hooks/import-export";

interface Props {
  eventId: string;
}

export function ImportExportTab({ eventId }: Props) {
  const importJsonMutation = useImportJson(eventId);
  const importCsvJudgesMutation = useImportCsvJudges(eventId);

  const [jsonText, setJsonText] = useState("");
  const [jsonDryRunResult, setJsonDryRunResult] = useState<DryRunSummary | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [csvText, setCsvText] = useState("");
  const [csvDryRunResult, setCsvDryRunResult] = useState<DryRunSummary | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);

  const handleExportJson = () => {
    window.open(`/api/events/${eventId}/export.json`, "_blank");
  };

  const handleExportCsv = (type: "projects" | "judges" | "results") => {
    if (type === "results") {
      window.open(`/api/events/${eventId}/export.csv?type=results`, "_blank");
      return;
    }
    window.open(`/api/events/${eventId}/export/${type}.csv`, "_blank");
  };

  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonText(event.target?.result as string || "");
    };
    reader.readAsText(file);
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText(event.target?.result as string || "");
    };
    reader.readAsText(file);
  };

  const handleDryRunJson = () => {
    setJsonError(null);
    setJsonDryRunResult(null);
    try {
      const parsed = JSON.parse(jsonText);
      importJsonMutation.mutate(
        { payload: parsed, dryRun: true },
        {
          onSuccess: (res) => setJsonDryRunResult(res),
          onError: (err) => setJsonError(err.message),
        }
      );
    } catch (err: unknown) {
      setJsonError((err as Error).message || "Invalid JSON syntax");
    }
  };

  const handleCommitJson = () => {
    setJsonError(null);
    try {
      const parsed = JSON.parse(jsonText);
      importJsonMutation.mutate(
        { payload: parsed, dryRun: false },
        {
          onSuccess: () => {
            alert("JSON data imported successfully!");
            setJsonText("");
            setJsonDryRunResult(null);
          },
          onError: (err) => setJsonError(err.message),
        }
      );
    } catch (err: unknown) {
      setJsonError((err as Error).message || "Invalid JSON syntax");
    }
  };

  const handleDryRunCsv = () => {
    setCsvError(null);
    setCsvDryRunResult(null);
    if (!csvText.trim()) {
      setCsvError("CSV content is empty");
      return;
    }
    importCsvJudgesMutation.mutate(
      { csvText, dryRun: true },
      {
        onSuccess: (res) => setCsvDryRunResult(res),
        onError: (err) => setCsvError(err.message),
      }
    );
  };

  const handleCommitCsv = () => {
    setCsvError(null);
    if (!csvText.trim()) {
      setCsvError("CSV content is empty");
      return;
    }
    importCsvJudgesMutation.mutate(
      { csvText, dryRun: false },
      {
        onSuccess: () => {
          alert("CSV judges imported successfully!");
          setCsvText("");
          setCsvDryRunResult(null);
        },
        onError: (err) => setCsvError(err.message),
      }
    );
  };

  return (
    <div className="space-y-8">
      {/* Export Section */}
      <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-white">Export Event Data</h2>
        <p className="mt-1 text-sm text-white/70">
          Download event structural data, submissions, scores, and normalized results.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportJson}
            className="rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
          >
            Export Event JSON
          </button>
          <button
            type="button"
            onClick={() => handleExportCsv("projects")}
            className="rounded-md border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/5 transition-colors"
          >
            Export Projects CSV
          </button>
          <button
            type="button"
            onClick={() => handleExportCsv("judges")}
            className="rounded-md border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/5 transition-colors"
          >
            Export Judges CSV
          </button>
          <button
            type="button"
            onClick={() => handleExportCsv("results")}
            className="rounded-md border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/5 transition-colors"
          >
            Export Results CSV
          </button>
        </div>
      </div>

      {/* JSON Import Section */}
      <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-white">Bulk Import (JSON)</h2>
        <p className="mt-1 text-sm text-white/70">
          Import teams and projects in bulk from an exported JSON schema.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">
              Select JSON File or Paste JSON Content
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleJsonFileUpload}
              className="block w-full text-xs text-white/50 file:mr-4 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white/80 hover:file:bg-white/20 transition-colors cursor-pointer"
            />
          </div>

          <textarea
            rows={5}
            placeholder='Paste JSON here (e.g. { "teams": [...] })'
            className="w-full rounded-md border border-white/20 bg-white/5 backdrop-blur-md text-white placeholder-white/50 p-3 font-mono text-xs shadow-[0_4px_30px_rgba(0,0,0,0.1)] focus:bg-white/10 focus:border-df-cyan focus:outline-none focus:ring-1 focus:ring-df-cyan"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          />

          {jsonError && (
            <div className="rounded-md bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/30">
              {jsonError}
            </div>
          )}

          {jsonDryRunResult && (
            <div className="rounded-md bg-blue-500/10 p-4 text-xs text-blue-400 border border-blue-500/30">
              <h4 className="font-semibold text-sm text-blue-300">Dry-Run Preview Result</h4>
              <p className="mt-1">
                Teams to create: <strong className="text-white">{jsonDryRunResult.summary.teamsToCreate ?? 0}</strong> |
                Projects to create: <strong className="text-white">{jsonDryRunResult.summary.projectsToCreate ?? 0}</strong>
              </p>
              {jsonDryRunResult.summary.errors && jsonDryRunResult.summary.errors.length > 0 && (
                <div className="mt-2 text-red-400">
                  <strong className="text-red-300">Errors/Warnings:</strong>
                  <ul className="list-disc pl-4 mt-1">
                    {jsonDryRunResult.summary.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDryRunJson}
              disabled={importJsonMutation.isPending || !jsonText.trim()}
              className="rounded-md border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/5 disabled:opacity-50 transition-colors"
            >
              {importJsonMutation.isPending ? "Validating..." : "Preview (Dry Run)"}
            </button>
            <button
              type="button"
              onClick={handleCommitJson}
              disabled={importJsonMutation.isPending || !jsonText.trim()}
              className="rounded-md bg-df-pink px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              Commit Import
            </button>
          </div>
        </div>
      </div>

      {/* CSV Judges Import Section */}
      <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-white">Bulk Import Judges (CSV)</h2>
        <p className="mt-1 text-sm text-white/70">
          Upload or paste CSV content with columns: <code className="bg-white/10 px-1 py-0.5 rounded text-white/90">email, name, tracks</code>.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">
              Select CSV File or Paste CSV Content
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvFileUpload}
              className="block w-full text-xs text-white/50 file:mr-4 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white/80 hover:file:bg-white/20 transition-colors cursor-pointer"
            />
          </div>

          <textarea
            rows={5}
            placeholder="email,name,tracks&#10;judge1@example.com,Alice Judge,AI,Web"
            className="w-full rounded-md border border-white/20 bg-white/5 backdrop-blur-md text-white placeholder-white/50 p-3 font-mono text-xs shadow-[0_4px_30px_rgba(0,0,0,0.1)] focus:bg-white/10 focus:border-df-cyan focus:outline-none focus:ring-1 focus:ring-df-cyan"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
          />

          {csvError && (
            <div className="rounded-md bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/30">
              {csvError}
            </div>
          )}

          {csvDryRunResult && (
            <div className="rounded-md bg-blue-500/10 p-4 text-xs text-blue-400 border border-blue-500/30">
              <h4 className="font-semibold text-sm text-blue-300">Dry-Run Preview Result</h4>
              <p className="mt-1">
                Judges to import: <strong className="text-white">{csvDryRunResult.summary.judgesToImport ?? 0}</strong>
              </p>
              {csvDryRunResult.summary.errors && csvDryRunResult.summary.errors.length > 0 && (
                <div className="mt-2 text-red-400">
                  <strong className="text-red-300">Errors/Warnings:</strong>
                  <ul className="list-disc pl-4 mt-1">
                    {csvDryRunResult.summary.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDryRunCsv}
              disabled={importCsvJudgesMutation.isPending || !csvText.trim()}
              className="rounded-md border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/5 disabled:opacity-50 transition-colors"
            >
              {importCsvJudgesMutation.isPending ? "Validating..." : "Preview (Dry Run)"}
            </button>
            <button
              type="button"
              onClick={handleCommitCsv}
              disabled={importCsvJudgesMutation.isPending || !csvText.trim()}
              className="rounded-md bg-df-pink px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              Commit Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
