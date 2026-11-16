#!/usr/bin/env bash
set -euo pipefail
contenido="${PR_TITULO:-} ${PR_CUERPO:-}"
if grep -Eiq '((closes|fixes|refs|resolves)[[:space:]]+)?#[0-9]+' <<< "$contenido"; then
  echo 'OK: el Pull Request contiene referencia a un issue.'
else
  echo 'ERROR: el Pull Request debe mencionar un issue, por ejemplo: Refs #3.' >&2
  exit 1
fi
