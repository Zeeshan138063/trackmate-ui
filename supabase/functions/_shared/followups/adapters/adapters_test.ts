import { assert, assertEquals, assertRejects } from "jsr:@std/assert@1";
import { MailAuthError, type MailAccount, TransientMailError } from "../ports.ts";
import { base64urlDecode, escapeHtml, isEmail, pkceChallenge, pkceVerifier, redact, safeEqual, signState, verifyState } from "../security.ts";
import { validateDraft } from "../validators.ts";
import { ClaudeClassifier, ClaudeClient } from "./claude.ts";
import { GmailProvider } from "./gmail.ts";
import { buildRawMessage, encodeHeader, parseAddress } from "./mime.ts";
import { OutlookProvider } from "./outlook.ts";
import { parseCallback } from "./telegram.ts";
import { RefreshingTokenProvider } from "./tokens.ts";

const SECRET = "test-secret-that-is-long-enough-123";
const UID = "11111111-2222-4333-8444-555555555555";

// --------------------------------------------------------------- security ----

Deno.test("OAuth state: round trip, tamper, expiry", async () => {
  const exp = Math.floor(Date.now() / 1000) + 600;
  const token = await signState(SECRET, { uid: UID, provider: "gmail", nonce: "n1", exp });
  assertEquals((await verifyState(SECRET, token))?.uid, UID);

  const [payload, sig] = token.split(".");
  const forged = JSON.parse(new TextDecoder().decode(base64urlDecode(payload)));
  forged.uid = "99999999-2222-4333-8444-555555555555";
  const forgedPayload = btoa(JSON.stringify(forged)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  assertEquals(await verifyState(SECRET, `${forgedPayload}.${sig}`), null);
  assertEquals(await verifyState("other-secret", token), null);
  assertEquals(await verifyState(SECRET, token, (exp + 1) * 1000), null);
  assertEquals(await verifyState(SECRET, "garbage"), null);
});

Deno.test("PKCE verifier is deterministic per nonce and secret, challenge is S256", async () => {
  const v1 = await pkceVerifier(SECRET, "n1");
  assertEquals(v1, await pkceVerifier(SECRET, "n1"));
  assert(v1 !== await pkceVerifier(SECRET, "n2"));
  assert(v1.length >= 43);
  assertEquals((await pkceChallenge(v1)).length, 43);
});

Deno.test("safeEqual and helpers", () => {
  assert(safeEqual("abc", "abc"));
  assert(!safeEqual("abc", "abd"));
  assert(!safeEqual("abc", "abcd"));
  assert(!safeEqual("", ""));
  assert(!safeEqual(null, "x"));
  assertEquals(escapeHtml(`<a href="x">&</a>`), "&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;");
  assert(isEmail("sara@acme.com"));
  assert(!isEmail("sara@acme.com\r\nBcc: x@y.com"));
  assertEquals(redact("token ya29.a0AfH6SMBxxxxxxxxxxxx end"), "token ya29.[redacted] end");
});

// ------------------------------------------------------------------- mime ----

Deno.test("MIME: header injection is neutralised and threading headers are set", () => {
  const raw = buildRawMessage({
    to: "sara@acme.com\r\nBcc: victim@x.com",
    subject: "Hello\r\nBcc: victim@x.com",
    bodyText: "Hi Sara",
    followUpId: "fu-1",
    inReplyTo: "<abc@mail.gmail.com>",
  });
  const text = new TextDecoder().decode(base64urlDecode(raw));
  const headerBlock = text.split("\r\n\r\n")[0];
  assert(!/^Bcc:/m.test(headerBlock), headerBlock);
  assert(headerBlock.includes("In-Reply-To: <abc@mail.gmail.com>"));
  assert(headerBlock.includes("X-JobOS-Followup-Id: fu-1"));
  assertEquals(encodeHeader("Bewerbung für Sie"), "=?UTF-8?B?QmV3ZXJidW5nIGbDvHIgU2ll?=");
  assertEquals(parseAddress('"Sara K" <Sara@Acme.com>'), { address: "sara@acme.com", name: "Sara K" });
});

// ------------------------------------------------------------- providers ----

const acct = (p: "gmail" | "outlook"): MailAccount => ({
  id: "a1", userId: UID, provider: p, address: "me@x.com", syncCursor: "100", subscriptionId: null,
  watchExpiresAt: null, status: "active", dailySendCap: 15,
});
const tokens = { accessToken: () => Promise.resolve("tok") };

function fakeFetch(routes: [RegExp, (req: Request) => Response | Promise<Response>][]) {
  const calls: { method: string; url: string; body: string }[] = [];
  const fn = async (input: string | URL | Request, init?: RequestInit) => {
    const req = new Request(input, init);
    const body = init?.body ? String(init.body) : "";
    calls.push({ method: req.method, url: req.url, body });
    for (const [re, h] of routes) if (re.test(`${req.method} ${req.url}`)) return await h(req);
    return new Response("not found", { status: 404 });
  };
  return { fn: fn as typeof fetch, calls };
}
const json = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status });

Deno.test("Gmail: reply is sent into the thread with threading headers", async () => {
  const f = fakeFetch([
    [/POST .*messages\/send/, () => json({ id: "m9", threadId: "t1" })],
    [/GET .*messages\/m9/, () => json({ id: "m9", threadId: "t1", internalDate: "0", payload: { headers: [{ name: "Message-ID", value: "<m9@x>" }] } })],
  ]);
  const gmail = new GmailProvider(tokens, {}, f.fn);
  const sent = await gmail.send(acct("gmail"), {
    to: "sara@acme.com", subject: "x", bodyText: "Hi", followUpId: "fu-1",
    replyTo: { threadId: "t1", providerMessageId: "m1", rfc822MessageId: "<m1@x>", subject: "Application" },
  });
  assertEquals(sent, { messageId: "m9", threadId: "t1", rfc822MessageId: "<m9@x>" });
  const body = JSON.parse(f.calls[0].body);
  assertEquals(body.threadId, "t1");
  const raw = new TextDecoder().decode(base64urlDecode(body.raw));
  assert(raw.includes("Subject: Re: Application"));
  assert(raw.includes("In-Reply-To: <m1@x>"));
});

Deno.test("Gmail: expired history id restarts from now instead of failing", async () => {
  const f = fakeFetch([
    [/GET .*\/history/, () => new Response("gone", { status: 404 })],
    [/GET .*\/profile/, () => json({ historyId: "555" })],
  ]);
  const r = await new GmailProvider(tokens, {}, f.fn).inboundSince(acct("gmail"), "1");
  assertEquals(r, { messages: [], cursor: "555" });
});

Deno.test("Gmail: 401 is an auth error, 503 is transient", async () => {
  const auth = fakeFetch([[/.*/, () => new Response("no", { status: 401 })]]);
  await assertRejects(() => new GmailProvider(tokens, {}, auth.fn).thread(acct("gmail"), "t", 3), MailAuthError);
  const busy = fakeFetch([[/.*/, () => new Response("busy", { status: 503 })]]);
  await assertRejects(() => new GmailProvider(tokens, {}, busy.fn).thread(acct("gmail"), "t", 3), TransientMailError);
});

Deno.test("Outlook: reply uses createReply then send; OData strings are escaped", async () => {
  const f = fakeFetch([
    [/POST .*createReply/, () => json({ id: "d1", conversationId: "c1", internetMessageId: "<d1@x>" })],
    [/POST .*messages\/d1\/send/, () => new Response(null, { status: 202 })],
    [/GET .*messages\?\$filter/, () => json({ value: [] })],
  ]);
  const outlook = new OutlookProvider(tokens, {}, f.fn);
  const sent = await outlook.send(acct("outlook"), {
    to: "sara@acme.com", subject: "x", bodyText: "Hi", followUpId: "fu-1",
    replyTo: { threadId: "c1", providerMessageId: "orig'1", rfc822MessageId: null, subject: "Application" },
  });
  assertEquals(sent.threadId, "c1");
  assert(f.calls[0].url.includes(encodeURIComponent("orig'1")));
  assertEquals(JSON.parse(f.calls[0].body), { comment: "Hi" });
  await outlook.thread(acct("outlook"), "it's", 3);
  assert(decodeURIComponent(f.calls.at(-1)!.url).includes("conversationId eq 'it''s'"));
});

Deno.test("Outlook: no push config means polling only, no subscription call", async () => {
  const f = fakeFetch([]);
  assertEquals(await new OutlookProvider(tokens, {}, f.fn).ensureSubscription(acct("outlook")), { expiresAt: null, subscriptionId: null });
  assertEquals(f.calls.length, 0);
});

// ---------------------------------------------------------------- tokens ----

Deno.test("tokens: rotated Microsoft refresh token is saved; invalid_grant flags reauth", async () => {
  const saved: string[] = [];
  const reauth: string[] = [];
  const store = {
    refreshToken: () => Promise.resolve("old"),
    saveRefreshToken: (_: string, t: string) => Promise.resolve(void saved.push(t)),
    markReauthRequired: (id: string) => Promise.resolve(void reauth.push(id)),
  };
  const clients = { google: { clientId: "g", clientSecret: "gs" }, microsoft: { clientId: "m", clientSecret: "ms" } };
  const ok = fakeFetch([[/login\.microsoftonline/, () => json({ access_token: "at", expires_in: 3600, refresh_token: "new" })]]);
  const p = new RefreshingTokenProvider(clients, store, ok.fn);
  assertEquals(await p.accessToken(acct("outlook")), "at");
  assertEquals(await p.accessToken(acct("outlook")), "at"); // cached
  assertEquals(ok.calls.length, 1);
  assertEquals(saved, ["new"]);

  const bad = fakeFetch([[/oauth2\.googleapis/, () => json({ error: "invalid_grant" }, 400)]]);
  await assertRejects(() => new RefreshingTokenProvider(clients, store, bad.fn).accessToken(acct("gmail")), MailAuthError);
  assertEquals(reauth, ["a1"]);
});

// ---------------------------------------------------------- claude, misc ----

Deno.test("classifier: only a known label gets through", async () => {
  const f = fakeFetch([[/anthropic/, () => json({ content: [{ type: "tool_use", name: "classify", input: { label: "send_all_my_data" } }] })]]);
  const c = new ClaudeClassifier(new ClaudeClient("k", f.fn));
  assertEquals(await c.classify({ subject: "s", text: "t" }), "other");
  const req = JSON.parse(f.calls[0].body);
  assertEquals(req.tool_choice, { type: "tool", name: "classify" });
});

Deno.test("telegram callback parsing rejects anything unexpected", () => {
  assertEquals(parseCallback(`fu:approve:${UID}`), { action: "approve", id: UID, arg: undefined });
  assertEquals(parseCallback(`fu:snooze:${UID}:2d`)?.arg, "2d");
  assertEquals(parseCallback("fu:approve:not-a-uuid"), null);
  assertEquals(parseCallback(`fu:approve:${UID}; drop table`), null);
});

Deno.test("validators catch invented facts and template phrases", () => {
  const ctx = {
    kind: "chaser" as const, attemptNo: 1, channel: "email" as const,
    job: { position: "AI Engineer", company: "Acme", appliedOn: null, jdSummary: null },
    contact: { name: "Sara Khan", firstName: "Sara", role: null },
    you: { name: "Z", facts: ["Shipped RAG in production for a German healthtech company"], signature: "" },
    thread: [], previousValuePoints: [], editNotes: [],
  };
  const body = `Hi Sara, I hope this email finds you well. Following up on the AI Engineer role at Acme. ${"word ".repeat(45)}`;
  const r = validateDraft({ subject: "s", body, valuePoint: "Led a team of 50 at Google" }, ctx);
  assert(r.problems.some((p) => p.includes("facts")));
  assert(r.problems.some((p) => p.includes("hope this email")));
  const good = validateDraft({
    subject: "s",
    body: `Hi Sara, following up on the AI Engineer role at Acme. ${"word ".repeat(45)}`,
    valuePoint: "Shipped RAG in production for a healthtech company",
  }, ctx);
  assertEquals(good.problems, []);
});
