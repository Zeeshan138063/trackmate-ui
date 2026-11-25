// Permanently deletes the signed-in user's data and account (principle P9).
//   POST { confirm: "DELETE" }
// The user comes from the verified session, never from the body. Rows are removed table by
// table; if any delete fails for a real reason the function stops and the account is kept, so
// the user can retry. Only when every table is clear is the auth user deleted.

import { createClient } from "npm:@supabase/supabase-js@2";
import { errorResponse, requireUserId } from "../_shared/auth.ts";
import { appCors } from "../_shared/cors.ts";
import { confirmed, isAbsentTable, USER_TABLES } from "./tables.ts";

Deno.serve(async (req) => {
  const cors = appCors(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const reply = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    if (req.method !== "POST") return reply({ error: "method not allowed" }, 405);

    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const userId = await requireUserId(req, admin);

    const body = await req.json().catch(() => null);
    if (!confirmed(body)) return reply({ error: "confirmation required" }, 400);

    for (const table of USER_TABLES) {
      const { error } = await admin.from(table).delete().eq("user_id", userId);
      if (error && !isAbsentTable(error)) {
        console.error(`delete-account: ${table} failed`, error.code);
        return reply({ error: "could not delete all data; nothing further was removed, please try again", table }, 500);
      }
    }

    const { error: authError } = await admin.auth.admin.deleteUser(userId);
    if (authError) {
      console.error("delete-account: auth user delete failed", authError.status);
      return reply({ error: "your data was deleted but the account could not be closed; contact support" }, 500);
    }

    console.log("delete-account: completed"); // no user id or email in logs
    return reply({ ok: true });
  } catch (e) {
    return errorResponse(e, cors);
  }
});
