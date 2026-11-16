#!/usr/bin/env bash
set -euo pipefail
archivos=("frontend/index.html" "frontend/js/app.js" "frontend/js/datos.js" "frontend/js/reservas.js" "test/reservas.test.js" "package.json" ".github/workflows/cd-pages.yml")
for archivo in "${archivos[@]}"; do
  test -f "$archivo" || { echo "Falta $archivo"; exit 1; }
  echo "OK: $archivo"
done
