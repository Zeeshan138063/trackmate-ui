// CORS for browser-facing functions: only the JobOS app (APP_URL) and any extra origins listed
// in ALLOWED_ORIGINS (comma-separated, e.g. http://localhost:8080 for development) may call.

export function appCors(req: Request): Record<string, string> {
  const allowed = [Deno.env.get("APP_URL") ?? "", ...(Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",")]
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  const origin = req.headers.get("Origin") ?? "";
  return {
    ...(allowed.includes(origin) ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "600",
  };
}
