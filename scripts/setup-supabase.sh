#!/usr/bin/env bash
set -euo pipefail

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI is required. Install it first."
  exit 1
fi

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Please export SUPABASE_ACCESS_TOKEN first."
  exit 1
fi

PROJECT_REF="${1:-rnnanizhklbddjcxblwo}"

echo "Linking project ${PROJECT_REF}..."
supabase link --project-ref "${PROJECT_REF}"

echo "Pushing database schema..."
psql "${SUPABASE_DB_URL:?Please export SUPABASE_DB_URL}" -f supabase/schema.sql

echo "Deploying edge functions..."
supabase functions deploy parse-expense
supabase functions deploy dashboard
supabase functions deploy sync-subscription-candidates
supabase functions deploy confirm-subscription-candidate

echo "Done."
