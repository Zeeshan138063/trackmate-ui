import { assertEquals } from "jsr:@std/assert@1";
import { boardKey, feedUrl, firstMatchingKeyword, matchesAnyKeyword, normalize, parseBoard, toPlainText } from "./feeds.ts";

Deno.test("parseBoard reads Greenhouse, Lever and Ashby careers URLs", () => {
  assertEquals(parseBoard("https://boards.greenhouse.io/stripe"), { ats: "greenhouse", token: "stripe" });
  assertEquals(parseBoard("https://job-boards.greenhouse.io/stripe/jobs/123"), { ats: "greenhouse", token: "stripe" });
  assertEquals(parseBoard("https://boards.greenhouse.io/embed/job_board?for=cloudflare"), { ats: "greenhouse", token: "cloudflare" });
  assertEquals(parseBoard("https://jobs.lever.co/palantir/abc"), { ats: "lever", token: "palantir" });
  assertEquals(parseBoard("https://jobs.eu.lever.co/acme"), { ats: "lever", token: "acme", eu: true });
  assertEquals(parseBoard("https://jobs.ashbyhq.com/The%20Browser%20Company"), null); // spaces are not a safe token
  assertEquals(parseBoard("https://jobs.ashbyhq.com/ramp"), { ats: "ashby", token: "ramp" });
});

Deno.test("parseBoard refuses everything that is not a known job board", () => {
  for (const bad of [null, "", "not a url", "https://www.linkedin.com/company/acme/jobs", "https://acme.com/careers",
    "javascript:alert(1)", "https://boards.greenhouse.io/", "https://evil.example/boards.greenhouse.io/stripe"]) {
    assertEquals(parseBoard(bad), null);
  }
});

Deno.test("feedUrl builds the documented public endpoints", () => {
  assertEquals(feedUrl({ ats: "greenhouse", token: "stripe" }), "https://boards-api.greenhouse.io/v1/boards/stripe/jobs?content=true");
  assertEquals(feedUrl({ ats: "lever", token: "acme", eu: true }), "https://api.eu.lever.co/v0/postings/acme?mode=json");
  assertEquals(feedUrl({ ats: "ashby", token: "ramp" }), "https://api.ashbyhq.com/posting-api/job-board/ramp");
  assertEquals(boardKey({ ats: "lever", token: "Acme" }), "lever:acme");
});

Deno.test("normalize: Greenhouse uses first_published, never updated_at, as the posting date", () => {
  const jobs = normalize({ ats: "greenhouse", token: "vaulttec" }, "Vault-Tec", {
    jobs: [
      { id: 1, title: "Vault Designer", absolute_url: "https://boards.greenhouse.io/vaulttec/jobs/1", location: { name: "NYC" },
        updated_at: "2026-01-14T10:55:28-05:00", first_published: "2025-12-01T20:00:00Z", content: "&lt;p&gt;Build &amp;amp; test&lt;/p&gt;" },
      { id: 2, title: "Engineer", absolute_url: "https://boards.greenhouse.io/vaulttec/jobs/2", location: null, updated_at: "2026-01-14T10:55:28-05:00" },
      { id: 3, title: "", absolute_url: "https://boards.greenhouse.io/vaulttec/jobs/3" },
    ],
  });
  assertEquals(jobs.length, 2);
  assertEquals(jobs[0].external_id, "greenhouse:vaulttec:1");
  assertEquals(jobs[0].posted_at, "2025-12-01T20:00:00.000Z");
  assertEquals(jobs[0].description, "Build & test");
  assertEquals(jobs[0].company, "Vault-Tec");
  assertEquals(jobs[1].posted_at, null);
  assertEquals(jobs[1].location, null);
});

Deno.test("normalize: Lever converts epoch milliseconds and Ashby skips unlisted jobs", () => {
  const lever = normalize({ ats: "lever", token: "acme" }, "Acme", [
    { id: "a1", text: "Data Engineer", hostedUrl: "https://jobs.lever.co/acme/a1", categories: { location: "Riyadh" }, createdAt: 1760000000000, descriptionPlain: "Pipelines" },
  ]);
  assertEquals(lever[0].posted_at, new Date(1760000000000).toISOString());
  assertEquals(lever[0].location, "Riyadh");

  const ashby = normalize({ ats: "ashby", token: "ramp" }, "Ramp", {
    jobs: [
      { id: "x", title: "Hidden", jobUrl: "https://jobs.ashbyhq.com/ramp/x", isListed: false },
      { id: "y", title: "Backend Engineer", jobUrl: "https://jobs.ashbyhq.com/ramp/y", location: "Remote", publishedAt: "2026-04-07T17:12:35.753+00:00", isListed: true },
    ],
  });
  assertEquals(ashby.map((j) => j.external_id), ["ashby:ramp:y"]);
});

Deno.test("normalize returns nothing for an unexpected payload", () => {
  assertEquals(normalize({ ats: "lever", token: "acme" }, "Acme", "<html>error</html>"), []);
  assertEquals(normalize({ ats: "greenhouse", token: "acme" }, "Acme", null), []);
  assertEquals(normalize({ ats: "ashby", token: "acme" }, "Acme", { jobs: [{ id: 1, title: "T", jobUrl: "javascript:alert(1)" }] }), []);
});

Deno.test("keyword matching needs every word, as whole words", () => {
  assertEquals(matchesAnyKeyword("Senior Backend Engineer (Python)", ["backend engineer"]), true);
  assertEquals(matchesAnyKeyword("Senior Backend Engineer", ["frontend engineer", "data"]), false);
  assertEquals(matchesAnyKeyword("Javascript Developer", ["java"]), false);
  assertEquals(matchesAnyKeyword("C++ Developer", ["c++"]), true);
  assertEquals(matchesAnyKeyword("Anything", []), false);
  assertEquals(firstMatchingKeyword("Forward Deployed Engineer", ["solutions engineer", "deployed engineer"]), "deployed engineer");
});

Deno.test("toPlainText strips tags and scripts", () => {
  assertEquals(toPlainText("<p>Hello <b>world</b></p><script>x()</script>"), "Hello world");
  assertEquals(toPlainText(""), null);
});
