# 2026-11-26: agent setup and first architecture read

What a Cowork session found and set up. No product code was changed.

**Correction, same day:** the first read was done on `main`. The product branch is
`rebranding-jobos`, which already had the JobOS rebrand, the side-panel extension (3.1.0),
resume attachments in Supabase Storage (no S3) and no `extension (Copy)/`. The files in this
pull request were revised for `rebranding-jobos`; the linked architecture doc and audit still
describe `main` in those places.

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

- Verify baseline on `rebranding-jobos`: build passes, 28 type errors, 201 lint errors.
- Secret in the browser bundle: Novu key (`src/services/NovuService.ts`).
- The extension-to-app hand-off does not work: the app posts `CAREERPILOT_FETCH_JOB_DATA`, the
  bridge listens for `source: 'jobos-web-app'`.
- `sync-calendar` trusts `userId` from the request body with the service role key.
- `fetch-linkedin-jobs` cron URL has a typo in the project ref; LinkedIn publishing in
  `GrowthEngine` is simulated.
- Generated Supabase types cover 13 of 27 tables.

## Not done

- The kit's web CI workflow, dependency allowlist and Orval contract were not copied: there is
  no OpenAPI contract here (Supabase generated types take that role) and `verify` is red.
- The spec audit (section 8) has not been run.
- Nothing was committed, pushed or deployed.

## Next

1. Zee approves or edits the principles and answers OQ-01.
2. Run the audit; fill in `docs/prd/requirements.md`.
3. Spec and plan REQ-003 (contact stages and next actions) first: REQ-004 to REQ-007 build on it.
