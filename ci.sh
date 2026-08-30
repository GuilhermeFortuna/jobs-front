#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'EOF'
Usage: ./ci.sh [command]

Commands:
  all     Run the full CI suite (default)
  lint    Run ESLint
  format  Run Prettier check
  build   Run Next.js production build
EOF
}

run_lint() {
  echo "==> lint"
  pnpm lint
}

run_format() {
  echo "==> format"
  pnpm format:check
}

run_build() {
  echo "==> build"
  pnpm build
}

run_all() {
  run_lint
  run_format
  run_build
}

cmd="${1:-all}"

case "$cmd" in
  all)
    run_all
    ;;
  lint)
    run_lint
    ;;
  format)
    run_format
    ;;
  build)
    run_build
    ;;
  *)
    usage
    exit 1
    ;;
esac
