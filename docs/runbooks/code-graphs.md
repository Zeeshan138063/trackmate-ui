# Runbook: the code graphs are missing, stale or not used

Two tools index this repo so people and agents find code without grepping.

| Tool | Output | Good for |
|---|---|---|
| CodeGraph (`@colbymchenry/codegraph`) | `.codegraph/codegraph.db`, never committed | Exact questions: where is this symbol, who calls it, what does this task touch. Exposed to Claude Code as MCP tools |
| graphify (`graphifyy` on PyPI) | `graphify-out/` (`GRAPH_REPORT.md` is committed, the rest is ignored) | Shape questions: hubs, clusters, how two areas connect, what a change affects |

## State on 2026-11-26

`graphify-out/GRAPH_REPORT.md` was rebuilt in a Linux sandbox from `rebranding-jobos` (code-only
pass, cluster names not labelled, SQL migrations not parsed). The CodeGraph index is local to
each machine and is not in git: run `codegraph init` once. The
tools themselves were **not** installed on this Mac in that session, so do the one-time setup.

## One-time setup on each machine

```bash
# CodeGraph: installs the CLI and wires its MCP server into Claude Code
npx @colbymchenry/codegraph
# restart Claude Code, then in the repo:
codegraph status          # should report the index; if it errors: codegraph index

# graphify
pip install "graphifyy[sql]"        # [sql] lets it parse supabase/migrations
graphify install --project          # project-scoped skill for Claude Code
graphify claude install             # adds its CLAUDE.md section and the pre-search hook
graphify hook install               # rebuilds the graph on git commit
graphify update .                   # code-only rebuild, no LLM
```

Optional, costs model tokens: in Claude Code run `/graphify .` once for the full pass that also
reads the docs and names the clusters.

## Symptom and what to do

| What you see | Means | Do |
|---|---|---|
| Claude greps instead of using `codegraph_*` tools | MCP server not installed or Claude Code not restarted | Run the CodeGraph setup, restart |
| `codegraph status` errors on the database | Index copied from another machine does not suit this one | `codegraph index` |
| Results miss a file you just added | Index is stale | `codegraph sync`; `graphify update .` |
| `graphify query` says no graph | `graphify-out/graph.json` is ignored by git and absent on a fresh clone | `graphify update .` |
| SQLite "disk I/O error" from CodeGraph | Repo is on a network or synced drive | Keep the checkout on a local disk |

## After

If you changed how either tool is set up, update this file and the "Finding code" section of the
root `CLAUDE.md`.
