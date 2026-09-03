#!/usr/bin/env bash
set -euo pipefail

cd /app
pnpm install --frozen-lockfile

exec "$@"
