import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { FileStore } from "../ports.ts";

export const RESUME_BUCKET = "resumes";
const MAX_BYTES = 2 * 1024 * 1024;

/** Reads private resume files with the service role. Nothing is made public or signed here. */
export class SupabaseFileStore implements FileStore {
  constructor(private db: SupabaseClient) {}

  async download(storagePath: string): Promise<Uint8Array> {
    if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[^/]+$/i.test(storagePath)) throw new Error("invalid resume path");
    const { data, error } = await this.db.storage.from(RESUME_BUCKET).download(storagePath);
    if (error || !data) throw new Error("could not read the attached resume");
    if (data.size > MAX_BYTES) throw new Error("attached resume is larger than 2 MB");
    return new Uint8Array(await data.arrayBuffer());
  }
}
