# Fork maintenance guide

This is a **fork** of [`ChrisChen667788/wind-comic`](https://github.com/ChrisChen667788/wind-comic),
hosted at [`creativeone86/tv-series-pipeline`](https://github.com/creativeone86/tv-series-pipeline).

This file is kept **separate from `README.md`** on purpose: the upstream project owns `README.md`,
so keeping our notes here means pulling new upstream code never conflicts on this file.

Two things live here:

1. [How to pull the latest code from the original repo](#1-sync-the-latest-upstream-code) (repeatable, low-drama).
2. [How to run and build the project](#2-run--build-the-project).

---

## Remotes

The clone uses the standard fork layout:

| Remote     | Points to                                             | Used for                    |
| ---------- | ----------------------------------------------------- | --------------------------- |
| `origin`   | `git@github.com:creativeone86/tv-series-pipeline.git` | Your fork — you push here   |
| `upstream` | `git@github.com:ChrisChen667788/wind-comic.git`       | The original — new code in  |

One-time setup (already done on this machine, listed here for a fresh clone):

```bash
git clone git@github.com:creativeone86/tv-series-pipeline.git
cd tv-series-pipeline
git remote add upstream git@github.com:ChrisChen667788/wind-comic.git
git remote -v   # verify origin = your fork, upstream = original
```

---

## 1. Sync the latest upstream code

Do this whenever the original repo has new commits you want.

### Quick recipe

```bash
# 0. Start from a clean tree (commit or stash any WIP first)
git status

# 1. Get the latest from the original repo
git fetch upstream

# 2. Do the merge on a dedicated branch (never merge straight onto main)
git switch -c sync-$(date +%Y%m%d)

# 3. Bring the new source in
git merge upstream/main

# 4. If there are conflicts, resolve them (see below), then:
git add -A
git commit          # finishes the merge

# 5. Dependencies may have changed upstream — reconcile the lockfile
npm install

# 6. Make sure it still compiles and builds
npm run typecheck
npm run build

# 7. Push the branch to your fork and (optionally) fast-forward main
git push -u origin sync-$(date +%Y%m%d)
git switch main
git merge --ff-only sync-$(date +%Y%m%d)
git push origin main
```

### Resolving conflicts

Conflicts only happen where **both** you and upstream edited the same lines.
Git marks them like this:

```
<<<<<<< HEAD
   your version
=======
   upstream version
>>>>>>> upstream/main
```

- Edit the file, keep the correct combination of both sides, delete the `<<<<<<<`, `=======`, `>>>>>>>` markers.
- List what still needs resolving with `git diff --name-only --diff-filter=U`.
- For `package-lock.json`: don't hand-merge it. Resolve `package.json` first, then run `npm install` to regenerate the lockfile.
- After every file is fixed: `git add -A` then `git commit`.

### Fork-specific areas that tend to conflict

These are our customizations, so watch them during a sync:

- i18n layer: `lib/i18n.ts`, `lib/api-i18n.ts`, and `t.*` usage across `app/` and `components/`
- CJK UI gate: `scripts/cjk-ui-gate.mjs`, `lib/cjk-ui-gate/allowlist.json`
- Budget guards: `lib/budget-enforce.ts`, `lib/budget-guard.ts`
- CI: `.github/workflows/ci.yml`

### If a sync goes wrong

Because the sync happens on its own branch, `main` is untouched until the final fast-forward.
To abort a merge in progress:

```bash
git merge --abort        # undo an in-progress merge
git switch main          # main is still exactly where it was
git branch -D sync-...   # throw away the failed sync branch
```

---

## 2. Run & build the project

### Prerequisites

- **Node.js 20+** (the repo declares `"engines": { "node": ">=20.0.0" }`)
- **npm** (this repo uses `package-lock.json` — do not switch to pnpm/yarn)

### First-time setup

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file and fill in provider keys
cp .env.example .env.local
```

Minimum viable keys in `.env.local` (English & Chinese both work):

- `OPENAI_API_KEY` — script generation (any OpenAI-compatible endpoint)
- `MINIMAX_API_KEY` — image + video + TTS

Every key has a sensible fallback; you only need the providers you actually use.
See the comments inside `.env.example` for the full, annotated list.

### Develop

```bash
npm run dev        # Next.js app on http://localhost:3000
npm run dev:ws     # Yjs realtime collaboration WebSocket server on :1234 (run in a second terminal)
```

Open http://localhost:3000 and create your first short film.

### Production build

```bash
npm run build      # compile the Next.js production build
npm start          # serve the production build
```

### Quality checks

```bash
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
npm test           # vitest run (unit tests)
npm run test:e2e   # playwright end-to-end tests
```

### Optional: PostgreSQL

The app runs on SQLite by default. To use PostgreSQL, set the DB env vars
(see `.env.example`) and run:

```bash
npm run pg:migrate # apply schema (db/schema.pg.sql)
npm run pg:verify  # verify the schema
npm run pg:smoke   # quick connectivity smoke test
```

---

## Handy references

- Upstream project & docs: <https://github.com/ChrisChen667788/wind-comic>
- Full feature README: [`README.md`](README.md)
- BYO LLM providers: [`docs/llm-providers.md`](docs/llm-providers.md)
