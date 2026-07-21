#!/bin/sh
set -eu
cd "$(dirname "$0")";mode="${1:-check}"
if [ "${NODE_ENV:-}" = test ]; then
  export JWT_ISSUER="${JWT_ISSUER:-company-os-runtime}"
  export JWT_AUDIENCE="${JWT_AUDIENCE:-company-os-runtime-client}"
fi
required(){ eval "v=\${$1:-}";[ -n "$v" ]||{ echo "$1 is required" >&2;exit 1;};};config(){ required DATABASE_URL;required JWT_SECRET;required JWT_ISSUER;required JWT_AUDIENCE;[ "${#JWT_SECRET}" -ge 32 ]||{ echo 'JWT_SECRET must be at least 32 characters' >&2;exit 1;};}
case "$mode" in check)(cd backend&&npm run check);(cd frontend&&npm run build);;migrate)config;[ "${ALLOW_SCHEMA_MIGRATION:-}" = 1 ]||{ echo 'Set ALLOW_SCHEMA_MIGRATION=1' >&2;exit 1;};psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/db/migrations/001_governed_workflow.sql;;start)config;(cd backend&&npm start);;*)echo 'usage: ./start.sh check|migrate|start' >&2;exit 2;;esac
