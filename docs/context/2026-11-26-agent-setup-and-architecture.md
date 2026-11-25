# 2026-11-26: agent setup and first architecture read

What a Cowork session found and set up. No product code was changed.

## Read first

The full architecture write-up, with a system map, is the doc "JobOS: architecture and how the
pieces fit": https://claude.ai/artifact/NJQQzyoAo5K55rEWaSuCNF

## What was set up

- `CLAUDE.md` at the root and in `src/`, `supabase/`, `supabase/functions/_shared/followups/`,
  `extension/`; `AGENTS.md` pointing other agents at them.
- spec-driven-kit starter files: `docs/` tree, `work.md`, `CHANGELOG.md`, `.gitattributes`,
  `.github/` (pull request template, update-pr-branches workflow), `spec-kit.json`.
- `docs/prd/`: the strategy spec and `requirements.md` (REQ-001 to REQ-009 for the P0 features).
- `docs/architecture/principles.md`: P1 to P10, **draft until Zee approves**.
- `docs/questions/OQ-01`: the existing LinkedIn data collection.
- Code graphs: `.codegraph/` and `graphify-out/` (see `docs/runbooks/code-graphs.md`).
- `package.json` scripts: `typecheck`, `verify`, `test:followups`.

## What was found (traps that cost time)

- Verify baseline: build passes, 28 type errors, 199 lint errors.
- Secrets in the browser bundle: AWS keys (`src/utils/s3-helper.ts`), Novu key
  (`src/services/NovuService.ts`).
- `sync-calendar` trusts `userId` from the request body with the service role key.
- `fetch-linkedin-jobs` cron URL has a typo in the project ref; LinkedIn publishing in
  `GrowthEngine` is simulated.
- Generated Supabase types cover 13 of 27 tables.
- Three product names in the code: CareerPilot AI, TrackMate, JobOS.

## Not done

- The kit's web CI workflow, dependency allowlist and Orval contract were not copied: there is
  no OpenAPI contract here (Supabase generated types take that role) and `verify` is red.
- The spec audit (section 8) has not been run.
- Nothing was committed, pushed or deployed.

## Next

1. Zee approves or edits the principles and answers OQ-01.
2. Run the audit; fill in `docs/prd/requirements.md`.
3. Spec and plan REQ-003 (contact stages and next actions) first: REQ-004 to REQ-007 build on it.
