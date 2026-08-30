# Job Engine UI (`jobs-front`)

TypeScript frontend for discovering and browsing aggregated job openings.

Product north star: see [`jobs-back/docs/job-engine-v1-goal.md`](../jobs-back/docs/job-engine-v1-goal.md).

## Stack

- Node 22 + [pnpm](https://pnpm.io/)
- Next.js (App Router), React, TypeScript, Tailwind CSS
- ESLint + Prettier

This repo is scaffold-only so far: a minimal shell page and API base URL helper — no search UI yet.

## Prerequisites

- Node 22+
- pnpm 11+
- Python 3.12+ with `pip` or [uv](https://docs.astral.sh/uv/) (for pre-commit hooks)

## Local setup

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

App: [http://localhost:3000](http://localhost:3000)

### CI

Run the same validation as GitHub Actions (requires `pnpm install` first):

```bash
./ci.sh          # full suite
./ci.sh lint
./ci.sh format
./ci.sh build
```

To auto-fix formatting locally (not used in CI):

```bash
pnpm format
```

### Git hooks

Install [pre-commit](https://pre-commit.com/) and register commit + push hooks:

```bash
uv venv
uv pip install -r requirements-dev.txt
uv run pre-commit install --hook-type pre-commit --hook-type pre-push
```

Hook behavior:

- **pre-commit**: Prettier (`--write`) and ESLint (`--fix`) on staged files
- **pre-push**: `./ci.sh` (full CI suite)

Run hooks manually:

```bash
uv run pre-commit run --all-files
uv run pre-commit run --hook-stage pre-push --all-files
```

### Scripts

```bash
pnpm dev
pnpm build
```

## Cross-repo workflow

With [jobs-back](../jobs-back) alongside this repo:

1. In `jobs-back`: `docker compose up -d`
2. Copy `.env.example` → `.env` (backend) and `.env.example` → `.env.local` (frontend)
3. Backend: `uv sync --group dev && uv run uvicorn jobs_back.main:app --reload --port 8000`
4. Frontend: `pnpm install && pnpm dev`
5. Open `http://localhost:3000` and confirm `http://localhost:8000/health`

`NEXT_PUBLIC_API_URL` defaults to `http://localhost:8000` (see `src/lib/api.ts`).

## What's next

- Jobs list and detail views
- Search and filter controls wired to the API
- Provider/source badges and apply links
