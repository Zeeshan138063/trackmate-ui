// Caller authentication for edge functions that use the service role key.
//
// The service role key bypasses row level security, so a function must know who is calling
// before it touches a row (principle P5). Never read a user id from the request body.

// deno-lint-ignore no-explicit-any
type AdminClient = { auth: { getUser: (jwt: string) => Promise<{ data: { user: { id: string } | null }; error: unknown }> } } & Record<string, any>;

export class AuthError extends Error {
  status = 401;
  constructor(message = "sign in required") {
    super(message);
  }
}

/** Returns the id of the signed-in user who sent this request, or throws AuthError. */
export async function requireUserId(req: Request, admin: AdminClient): Promise<string> {
  const header = req.headers.get("Authorization") ?? "";
  const jwt = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!jwt) throw new AuthError();
  const { data, error } = await admin.auth.getUser(jwt);
  if (error || !data?.user) throw new AuthError();
  return data.user.id;
}

/** Maps a thrown value to a response without leaking internals to the browser. */
export function errorResponse(e: unknown, cors: Record<string, string>): Response {
  const isAuth = e instanceof AuthError;
  if (!isAuth) console.error("request failed:", e instanceof Error ? e.message : String(e));
  return new Response(JSON.stringify({ error: isAuth ? e.message : "request failed" }), {
    status: isAuth ? 401 : 500,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
