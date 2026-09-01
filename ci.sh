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
  test    Run Vitest component tests
  e2e     Run Playwright journeys
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

run_test() {
  echo "==> test"
  pnpm test
}

run_e2e() {
  echo "==> e2e"
  pnpm e2e:install
  pnpm e2e
}

run_all() {
  run_lint
  run_format
  run_build
  run_test
  run_e2e
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
  test)
    run_test
    ;;
  e2e)
    run_e2e
    ;;
  *)
    usage
    exit 1
    ;;
esac
