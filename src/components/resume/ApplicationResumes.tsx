import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, Download, FileText, Loader2, Paperclip, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type ApplicationResume,
  deleteResume,
  downloadResume,
  listResumes,
  MAX_RESUME_BYTES,
  saveTailoredResume,
  setAttached,
  uploadResume,
} from "@/lib/resumeFiles";
import type { MasterProfile } from "@/types/resume";

interface Props {
  jobId: string;
  company: string;
  tailoredResume: MasterProfile | null;
  /** Bumped by the parent after it saves a version itself (e.g. on print). */
  refreshKey?: number;
}

const kb = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

export function ApplicationResumes({ jobId, company, tailoredResume, refreshKey }: Props) {
  const [items, setItems] = useState<ApplicationResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setItems(await listResumes(jobId));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load, refreshKey]);

  const run = async (key: string, fn: () => Promise<unknown>, ok?: string) => {
    setBusy(key);
    try {
      await fn();
      if (ok) toast.success(ok);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const attached = items.find((r) => r.is_attached);

  return (
    <div className="rounded-lg border p-3 sm:p-4 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-semibold">
            <Paperclip className="h-4 w-4" /> Resume for this application
          </div>
          <p className="text-sm text-muted-foreground">
            {attached
              ? <>Attached: <span className="font-medium text-foreground break-all">{attached.file_name}</span>. Email follow-ups can include it.</>
              : "Attach the resume you sent, so you always know which version they have."}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:shrink-0">
          {tailoredResume && (
            <Button
              size="sm"
              disabled={!!busy}
              onClick={() =>
                run("tailored", async () => {
                  const r = await saveTailoredResume(jobId, tailoredResume, company);
                  toast.success(r.created ? "Tailored resume saved as PDF and attached." : "This version is already saved; it's now attached.");
                })}
            >
              {busy === "tailored" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Paperclip className="mr-1 h-4 w-4" />}
              Attach tailored resume
            </Button>
          )}
          <Button size="sm" variant="outline" disabled={!!busy} onClick={() => fileInput.current?.click()}>
            {busy === "upload" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
            Upload PDF or DOCX
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              if (file.size > MAX_RESUME_BYTES) return void toast.error("Resume must be under 2 MB.");
              run("upload", () => uploadResume(jobId, file), "Resume uploaded and attached.");
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading</div>
      ) : items.length > 0 && (
        <ul className="divide-y rounded-md border">
          {items.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 p-2.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-2 sm:items-center">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground sm:mt-0" />
                <div className="min-w-0 flex-1">
                  <div className="break-all font-medium sm:truncate sm:break-normal" title={r.file_name}>{r.file_name}</div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span>{r.source === "tailored" ? "Tailored" : "Uploaded"} · {kb(r.size_bytes)} · {format(new Date(r.created_at), "d MMM yyyy, HH:mm")}</span>
                    {r.is_attached && (
                      <Badge className="bg-green-100 px-1.5 py-0 text-[11px] text-green-700 hover:bg-green-100">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Attached
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center justify-end gap-1 border-t pt-2 sm:border-0 sm:pt-0">
                {!r.is_attached ? (
                  <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => run(`a-${r.id}`, () => setAttached(jobId, r.id), "Attached.")}>
                    Attach
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => run(`a-${r.id}`, () => setAttached(jobId, null), "Detached.")}>
                    Detach
                  </Button>
                )}
                <Button size="icon" variant="ghost" aria-label={`Download ${r.file_name}`} disabled={!!busy} onClick={() => run(`d-${r.id}`, () => downloadResume(r))}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Delete ${r.file_name}`}
                  disabled={!!busy}
                  onClick={() => {
                    if (window.confirm(`Delete ${r.file_name}? This cannot be undone.`)) run(`x-${r.id}`, () => deleteResume(r), "Deleted.");
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
