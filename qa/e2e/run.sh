#!/usr/bin/env bash
# Un solo comando: instalar deps (si hace falta) y correr la suite.
set -euo pipefail
cd "$(dirname "$0")"
if [[ ! -d node_modules ]]; then
  pnpm install
fi
# Si no hay Chrome de Playwright, usa el Chrome del sistema (channel=chrome en config).
pnpm test "$@"
echo
echo "Reporte HTML: pnpm report"
