#!/usr/bin/env bash
set -euo pipefail

api_url="${API_URL:?Supabase API_URL is required}"
anon_key="${ANON_KEY:?Supabase ANON_KEY is required}"
response_file="$(mktemp)"
trap 'rm -f "$response_file"' EXIT

status_code="$(curl --silent --show-error --output "$response_file" --write-out '%{http_code}' \
  --header "apikey: $anon_key" \
  --header "Authorization: Bearer $anon_key" \
  --header 'Accept-Profile: private' \
  "$api_url/rest/v1/sources?select=id")"
if [[ "$status_code" != "406" ]] || ! grep --quiet --fixed-strings 'PGRST106' "$response_file"; then
  echo "The private schema was not rejected by the Data API."
  exit 1
fi

status_code="$(curl --silent --show-error --output "$response_file" --write-out '%{http_code}' \
  --request POST \
  --header "apikey: $anon_key" \
  --header "Authorization: Bearer $anon_key" \
  --header 'Content-Profile: private' \
  --header 'Content-Type: application/json' \
  --data '{}' \
  "$api_url/rest/v1/rpc/current_user_id")"
if [[ "$status_code" != "406" ]] || ! grep --quiet --fixed-strings 'PGRST106' "$response_file"; then
  echo "The private RPC schema was not rejected by the Data API."
  exit 1
fi

status_code="$(curl --silent --show-error --output "$response_file" --write-out '%{http_code}' \
  --request POST \
  --header "apikey: $anon_key" \
  --header "Authorization: Bearer $anon_key" \
  --header 'Content-Type: application/json' \
  --data '{"prefix":"","limit":1,"offset":0}' \
  "$api_url/storage/v1/object/list/cadence-private")"
if [[ "$status_code" == "200" ]] && ! grep --quiet --extended-regexp '^[[:space:]]*\[[[:space:]]*\][[:space:]]*$' "$response_file"; then
  echo "The private Storage bucket returned objects to an unauthenticated list request."
  exit 1
fi

status_code="$(curl --silent --show-error --output "$response_file" --write-out '%{http_code}' \
  --request POST \
  --header "apikey: $anon_key" \
  --header "Authorization: Bearer $anon_key" \
  --header 'Content-Type: text/plain' \
  --data 'synthetic storage policy probe' \
  "$api_url/storage/v1/object/cadence-private/cadence-access-probe.txt")"
if [[ "$status_code" == "200" ]] || [[ "$status_code" == "201" ]]; then
  echo "The private Storage bucket accepted an unauthenticated upload."
  exit 1
fi

echo "Private Data API, RPC schema, and Storage access checks passed."
