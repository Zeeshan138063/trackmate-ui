// Resume files attached to applications.
// Stored in the PRIVATE "resumes" bucket under <user_id>/<job_id>/<random>.<ext>.
// Nothing is public: downloads use signed URLs that expire after 60 seconds,
// and storage policies only let you reach your own folder.

import { supabase } from "@/integrations/supabase/client";
import type { MasterProfile } from "@/types/resume";

export const RESUME_BUCKET = "resumes";
export const MAX_RESUME_BYTES = 2 * 1024 * 1024;
export const PDF = "application/pdf";
export const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const SIGNED_URL_SECONDS = 60;

export interface ApplicationResume {
  id: string;
  job_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  source: "tailored" | "upload";
  is_attached: boolean;
  created_at: string;
  resume_json?: MasterProfile | null;
  content_hash?: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const table = () => supabase.from("application_resumes" as never);

function assertJobId(jobId: string) {
  if (!UUID.test(jobId)) throw new Error("Invalid application.");
}

/** Check the real file type from its first bytes, not the name or browser-reported type. */
export async function sniffType(file: Blob): Promise<typeof PDF | typeof DOCX | null> {
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46 && head[4] === 0x2d) return PDF; // %PDF-
  if (head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04) return DOCX; // ZIP container
  return null;
}

export function cleanFileName(name: string, ext: "pdf" | "docx"): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[^\p{L}\p{N} ._-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 100);
  return `${base || "Resume"}.${ext}`;
}

async function sha256(data: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function listResumes(jobId: string): Promise<ApplicationResume[]> {
  assertJobId(jobId);
  const { data, error } = await table()
    .select("id, job_id, file_name, mime_type, size_bytes, source, is_attached, created_at, content_hash")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Could not load resumes.");
  return (data ?? []) as unknown as ApplicationResume[];
}

/** The most recent tailored resume data for an application, so it reopens after a reload. */
export async function latestTailored(jobId: string): Promise<MasterProfile | null> {
  assertJobId(jobId);
  const { data } = await table()
    .select("resume_json")
    .eq("job_id", jobId)
    .eq("source", "tailored")
    .order("is_attached", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data as { resume_json?: MasterProfile } | null)?.resume_json) ?? null;
}

async function store(
  jobId: string,
  body: Blob,
  meta: { fileName: string; mime: string; source: "tailored" | "upload"; resumeJson?: MasterProfile; hash?: string },
  attach: boolean,
): Promise<ApplicationResume> {
  assertJobId(jobId);
  if (body.size === 0 || body.size > MAX_RESUME_BYTES) throw new Error("Resume must be under 2 MB.");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in again.");

  const ext = meta.mime === PDF ? "pdf" : "docx";
  const path = `${user.id}/${jobId}/${crypto.randomUUID()}.${ext}`;
  const up = await supabase.storage.from(RESUME_BUCKET).upload(path, body, {
    contentType: meta.mime,
    upsert: false,
    cacheControl: "0",
  });
  if (up.error) throw new Error("Upload failed. Please try again.");

  const { data, error } = await table()
    .insert({
      user_id: user.id,
      job_id: jobId,
      storage_path: path,
      file_name: meta.fileName,
      mime_type: meta.mime,
      size_bytes: body.size,
      source: meta.source,
      resume_json: meta.resumeJson ?? null,
      content_hash: meta.hash ?? null,
    } as never)
    .select("id, job_id, file_name, mime_type, size_bytes, source, is_attached, created_at, content_hash")
    .single();
  if (error) {
    await supabase.storage.from(RESUME_BUCKET).remove([path]); // don't leave an orphaned file
    throw new Error("Could not save the resume.");
  }
  const row = data as unknown as ApplicationResume;
  if (attach) await setAttached(jobId, row.id);
  return { ...row, is_attached: attach };
}

/** Upload a file you already have (the exact PDF or DOCX you submitted). */
export async function uploadResume(jobId: string, file: File, attach = true): Promise<ApplicationResume> {
  if (file.size > MAX_RESUME_BYTES) throw new Error("Resume must be under 2 MB.");
  const mime = await sniffType(file);
  if (!mime) throw new Error("Only PDF or Word (.docx) files are supported.");
  return await store(jobId, file, { fileName: cleanFileName(file.name, mime === PDF ? "pdf" : "docx"), mime, source: "upload" }, attach);
}

/**
 * Save a tailored resume as a PDF on the application. Returns the existing version
 * instead of a duplicate when the content hasn't changed.
 */
export async function saveTailoredResume(
  jobId: string,
  resume: MasterProfile,
  company: string,
  attach = true,
): Promise<{ resume: ApplicationResume; created: boolean }> {
  const hash = await sha256(JSON.stringify(resume));
  const existing = (await listResumes(jobId)).find((r) => r.source === "tailored" && r.content_hash === hash);
  if (existing) {
    if (attach && !existing.is_attached) await setAttached(jobId, existing.id);
    return { resume: { ...existing, is_attached: attach || existing.is_attached }, created: false };
  }
  const { generateResumePdf, resumeFileName } = await import("./resumePdf");
  const bytes = await generateResumePdf(resume);
  const blob = new Blob([bytes], { type: PDF });
  const row = await store(jobId, blob, { fileName: resumeFileName(resume, company), mime: PDF, source: "tailored", resumeJson: resume, hash }, attach);
  return { resume: row, created: true };
}

export async function setAttached(jobId: string, resumeId: string | null): Promise<void> {
  assertJobId(jobId);
  const { error } = await supabase.rpc("attach_application_resume" as never, { p_job_id: jobId, p_resume_id: resumeId } as never);
  if (error) throw new Error("Could not update the attached resume.");
}

/** Short-lived signed link; opened immediately, never stored or shown. */
export async function downloadResume(resume: ApplicationResume): Promise<void> {
  const { data: row, error: rowError } = await table().select("storage_path").eq("id", resume.id).single();
  if (rowError || !row) throw new Error("Resume not found.");
  const { data, error } = await supabase.storage
    .from(RESUME_BUCKET)
    .createSignedUrl((row as { storage_path: string }).storage_path, SIGNED_URL_SECONDS, { download: resume.file_name });
  if (error || !data?.signedUrl) throw new Error("Could not create a download link.");
  const a = document.createElement("a");
  a.href = data.signedUrl;
  a.rel = "noopener noreferrer";
  a.click();
}

export async function deleteResume(resume: ApplicationResume): Promise<void> {
  const { data: row } = await table().select("storage_path").eq("id", resume.id).single();
  const path = (row as { storage_path?: string } | null)?.storage_path;
  if (path) {
    const { error } = await supabase.storage.from(RESUME_BUCKET).remove([path]);
    if (error) throw new Error("Could not delete the file.");
  }
  const { error } = await table().delete().eq("id", resume.id);
  if (error) throw new Error("Could not delete the resume.");
}
