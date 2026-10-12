#!/usr/bin/env bash
# Deploy a prebuilt static site (dist/) to Base44 with "Deploy a prebuilt site" (deploy-dist, beta).
#
# Contract (source: https://docs.base44.com/api-reference/deploy-a-prebuilt-site.md, read 2026-10-12):
#   POST https://app.base44.com/api/apps/{app_id}/deploy-dist
#   auth: workspace API key in header "api_key" (scope apps:deploy),
#         or a personal access token as "Authorization: Bearer <token>"
#   body: multipart/form-data, field "file" = gzipped tar, file name ending in .tar.gz,
#         index.html at the archive root
#   limits: <= 50 MB packed and unpacked, <= 1000 files, 5 requests/minute per workspace
#   200 -> { "deployed_at": "...", "app_url": "https://....base44.app" }
# Full notes, sources and the troubleshooting table: docs/DEPLOY_BASE44.md
#
# Inputs (environment variables only; secrets are never echoed):
#   BASE44_APP_ID        required
#   BASE44_API_KEY       required (secret)
#   DIST_DIR             default: dist
#   BASE44_API_BASE      default: https://app.base44.com   (documented server)
#   BASE44_AUTH_HEADER   default: api_key                  (documented for workspace keys)
#                        or: bearer                        (documented for personal access tokens)
#   BASE44_UPLOAD_MODE   default: multipart                (documented: form field "file")
#                        or: raw  (UNDOCUMENTED fallback: body is the archive, application/gzip)
#   BASE44_RETRY_WAIT_SECONDS  default: 65 (wait after HTTP 429 before the single retry)
#   BASE44_DRY_RUN       "1" = pack and check limits only, do not upload
#   GITHUB_OUTPUT        if set, "app_url=<url>" and "deployed_at=<ts>" are appended
#
# Never add `set -x` to this file: it would print the API key.

set -euo pipefail
umask 077

log() { printf '[deploy-base44] %s\n' "$*"; }
err() { printf '[deploy-base44] ERROR: %s\n' "$*" >&2; }
die() {
  err "$*"
  exit 1
}

# ---------------------------------------------------------------- inputs
DIST_DIR="${DIST_DIR:-dist}"
API_BASE="${BASE44_API_BASE:-https://app.base44.com}"
API_BASE="${API_BASE%/}"
AUTH_MODE="${BASE44_AUTH_HEADER:-api_key}"
UPLOAD_MODE="${BASE44_UPLOAD_MODE:-multipart}"
RETRY_WAIT="${BASE44_RETRY_WAIT_SECONDS:-65}"
DRY_RUN="${BASE44_DRY_RUN:-0}"

readonly MAX_BYTES=50000000 # "50 MB" in the docs; decimal MB is the safe reading
readonly MAX_FILES=1000
readonly MAX_BODY_CHARS=4000

APP_ID="${BASE44_APP_ID:-}"
API_KEY="${BASE44_API_KEY:-}"
# Keep the key out of the environment of every child process (tar, node, find...).
unset BASE44_API_KEY

[[ -n "$APP_ID" ]] || die "BASE44_APP_ID is not set."
[[ "$APP_ID" =~ ^[A-Za-z0-9_-]{1,64}$ ]] || die "BASE44_APP_ID has unexpected characters."

if [[ "$DRY_RUN" != "1" ]]; then
  [[ -n "$API_KEY" ]] || die "BASE44_API_KEY is not set (it must come from the GitHub secret)."
  # A newline or CR inside the key would let it inject extra HTTP headers.
  [[ "$API_KEY" != *$'\n'* && "$API_KEY" != *$'\r'* ]] ||
    die "BASE44_API_KEY contains a line break. Re-create the GitHub secret without a trailing newline."
fi

case "$AUTH_MODE" in
  api_key) AUTH_DESC='header "api_key: <redacted>" (workspace API key, documented)' ;;
  bearer) AUTH_DESC='header "Authorization: Bearer <redacted>" (personal access token, documented)' ;;
  *) die "BASE44_AUTH_HEADER must be 'api_key' or 'bearer' (got an unsupported value)." ;;
esac

case "$UPLOAD_MODE" in
  multipart) UPLOAD_DESC='multipart/form-data, field "file" (documented)' ;;
  raw) UPLOAD_DESC='raw body, Content-Type: application/gzip (UNDOCUMENTED fallback)' ;;
  *) die "BASE44_UPLOAD_MODE must be 'multipart' or 'raw' (got an unsupported value)." ;;
esac

[[ "$RETRY_WAIT" =~ ^[0-9]{1,3}$ ]] || die "BASE44_RETRY_WAIT_SECONDS must be a whole number."

# Only https, except a loopback address used for local dry runs against a fake server.
if [[ "$API_BASE" =~ ^https://[A-Za-z0-9.-]+(:[0-9]+)?$ ]]; then
  PROTO='=https'
elif [[ "$API_BASE" =~ ^http://(127\.0\.0\.1|localhost)(:[0-9]+)?$ ]]; then
  PROTO='=http'
  log "WARNING: plain http to a loopback address (local test only)."
else
  die "BASE44_API_BASE must look like https://host (no path). Got: ${API_BASE}"
fi

# Redact the key from any text before it is printed (pure bash: the key never leaves this process).
redact() {
  local text="$1"
  if [[ -n "$API_KEY" ]]; then
    text="${text//"$API_KEY"/[REDACTED]}"
  fi
  printf '%s' "$text"
}

# ---------------------------------------------------------------- checks on dist/
[[ -d "$DIST_DIR" ]] || die "Folder '${DIST_DIR}' does not exist. Run 'npm run build' first."
[[ -f "$DIST_DIR/index.html" ]] || die "'${DIST_DIR}/index.html' is missing. Refusing to deploy."

# Base44 silently drops links and paths containing ':' — fail loudly instead.
links="$(find "$DIST_DIR" -type l | head -n 5)"
[[ -z "$links" ]] || die "'${DIST_DIR}' contains symbolic links (Base44 drops them): ${links}"
colon_paths="$(find "$DIST_DIR" -mindepth 1 -name '*:*' | head -n 5)"
[[ -z "$colon_paths" ]] || die "'${DIST_DIR}' has paths with ':' (Base44 drops them): ${colon_paths}"

file_count="$(find "$DIST_DIR" -type f | wc -l | tr -d ' ')"
unpacked_bytes="$(find "$DIST_DIR" -type f -printf '%s\n' | awk '{ s += $1 } END { printf "%d", s }')"
log "dist folder: ${DIST_DIR} | files: ${file_count} (limit ${MAX_FILES}) | unpacked bytes: ${unpacked_bytes} (limit ${MAX_BYTES})"
((file_count <= MAX_FILES)) || die "Too many files: ${file_count} > ${MAX_FILES}."
((unpacked_bytes <= MAX_BYTES)) || die "Unpacked size too large: ${unpacked_bytes} > ${MAX_BYTES} bytes."

# ---------------------------------------------------------------- pack
WORK_DIR="$(mktemp -d)"
cleanup() { rm -rf "$WORK_DIR"; }
trap cleanup EXIT

ARCHIVE="$WORK_DIR/site.tar.gz" # file name must end in .tar.gz (documented)
tar -czf "$ARCHIVE" -C "$DIST_DIR" .
packed_bytes="$(wc -c <"$ARCHIVE" | tr -d ' ')"
log "archive: site.tar.gz | packed bytes: ${packed_bytes} (limit ${MAX_BYTES})"
((packed_bytes <= MAX_BYTES)) || die "Archive too large: ${packed_bytes} > ${MAX_BYTES} bytes."
tar -tzf "$ARCHIVE" | grep -qxE '(\./)?index\.html' || die "index.html is not at the archive root."

ENDPOINT_PATH="/api/apps/${APP_ID}/deploy-dist"
log "request: POST ${API_BASE}${ENDPOINT_PATH}"
log "auth: ${AUTH_DESC}"
log "upload: ${UPLOAD_DESC}"

if [[ "$DRY_RUN" == "1" ]]; then
  log "BASE44_DRY_RUN=1: checks passed, nothing uploaded."
  exit 0
fi

# ---------------------------------------------------------------- upload
BODY_FILE="$WORK_DIR/response.body"
HEADERS_FILE="$WORK_DIR/response.headers"

# One attempt. Prints the HTTP status (000 when curl could not get a response).
# The auth header is passed to curl on stdin (`-H @-`), so the key is never on a command line
# (not visible in `ps`) and never written to disk.
upload_once() {
  local -a args=(
    --silent --show-error
    --proto "$PROTO" --proto-redir "$PROTO"
    --connect-timeout 20 --max-time 300
    --request POST
    --output "$BODY_FILE"
    --dump-header "$HEADERS_FILE"
    --write-out '%{http_code}'
    --header @-
  )
  if [[ "$UPLOAD_MODE" == "multipart" ]]; then
    args+=(--form "file=@${ARCHIVE};type=application/gzip;filename=site.tar.gz")
  else
    args+=(--header 'Content-Type: application/gzip' --data-binary "@${ARCHIVE}")
  fi
  args+=("${API_BASE}${ENDPOINT_PATH}")

  : >"$BODY_FILE"
  : >"$HEADERS_FILE"
  local status curl_rc=0
  if [[ "$AUTH_MODE" == "api_key" ]]; then
    status="$(printf 'api_key: %s\n' "$API_KEY" | curl "${args[@]}" 2>"$WORK_DIR/curl.err")" || curl_rc=$?
  else
    status="$(printf 'Authorization: Bearer %s\n' "$API_KEY" | curl "${args[@]}" 2>"$WORK_DIR/curl.err")" ||
      curl_rc=$?
  fi
  if ((curl_rc != 0)); then
    err "curl exit code ${curl_rc}: $(redact "$(head -c 500 "$WORK_DIR/curl.err")")"
  fi
  printf '%s' "${status:-000}"
}

# What the docs say each status means (docs/DEPLOY_BASE44.md has the full table).
hint_for() {
  case "$1" in
    000) echo "No HTTP response: DNS, network or TLS problem, or a timeout. Check BASE44_API_BASE." ;;
    400) echo "Archive rejected: bad file name, too large, too many files, unreadable, or no index.html at root." ;;
    401) echo "Missing or invalid credentials. Check the secret, and BASE44_AUTH_HEADER (api_key for a workspace key, bearer for a personal token)." ;;
    403) echo "Key not allowed: read-only key, missing scope apps:deploy, key does not cover this app, or no publish permission." ;;
    404) echo "App not found: check BASE44_APP_ID, or the host/path in BASE44_API_BASE." ;;
    409) echo "The app left the key's workspace or the key was revoked during the request. Nothing was published." ;;
    415) echo "Unsupported body type. Try the other BASE44_UPLOAD_MODE." ;;
    422) echo "The 'file' field is missing. If BASE44_UPLOAD_MODE=raw, switch back to multipart." ;;
    429) echo "Rate limit (5 requests/minute per workspace)." ;;
    5??) echo "Base44 server error. Try again later." ;;
    *) echo "Unexpected status." ;;
  esac
}

print_failure() {
  local status="$1"
  err "HTTP status: ${status}"
  err "meaning: $(hint_for "$status")"
  err "sent to: POST ${API_BASE}${ENDPOINT_PATH}"
  err "auth used: ${AUTH_DESC}"
  err "upload used: ${UPLOAD_DESC}"
  if [[ -s "$HEADERS_FILE" ]]; then
    # Response headers only (never request headers); drop cookies.
    local hdrs
    hdrs="$(tr -d '\r' <"$HEADERS_FILE" | grep -viE '^(set-cookie|cookie|authorization|api_key)[[:space:]]*:' |
      grep -iE '^(HTTP/|content-type|retry-after|x-request-id|x-ratelimit|date|server|cf-ray|location)' || true)"
    if [[ -n "$hdrs" ]]; then
      err "response headers (filtered):"
      while IFS= read -r line; do err "  $(redact "$line")"; done <<<"$hdrs"
    fi
  fi
  if [[ -s "$BODY_FILE" ]]; then
    local body
    body="$(head -c "$MAX_BODY_CHARS" "$BODY_FILE" | tr -d '\000')"
    err "response body (first ${MAX_BODY_CHARS} chars, key redacted):"
    err "$(redact "$body")"
  else
    err "response body: (empty)"
  fi
}

status="$(upload_once)"
if [[ "$status" == "429" ]]; then
  log "HTTP 429 (rate limit). Waiting ${RETRY_WAIT} s, then retrying once."
  sleep "$RETRY_WAIT"
  status="$(upload_once)"
fi

if [[ "$status" != "200" ]]; then
  print_failure "$status"
  exit 1
fi

# ---------------------------------------------------------------- parse the response
# node reads the response file; the key is not in its environment (unset above).
parsed="$(
  node -e '
    const fs = require("fs");
    let data;
    try { data = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); } catch { process.exit(2); }
    const at = typeof data.deployed_at === "string" ? data.deployed_at : "";
    const url = typeof data.app_url === "string" ? data.app_url : "";
    if (/[\u0000-\u001f\u007f]/.test(at + url)) process.exit(3);
    process.stdout.write(at + "\n" + url + "\n");
  ' "$BODY_FILE"
)" || {
  print_failure "200 (but the body is not JSON, or a field has control characters)"
  exit 1
}
deployed_at="$(sed -n 1p <<<"$parsed")"
app_url="$(sed -n 2p <<<"$parsed")"
app_url="${app_url%/}"

# Strict shapes: these values go to $GITHUB_OUTPUT and to the smoke job.
if [[ ! "$app_url" =~ ^https?://[A-Za-z0-9.-]+(:[0-9]+)?(/[A-Za-z0-9._~/-]*)?$ ]]; then
  print_failure "200 (but app_url is missing or malformed)"
  exit 1
fi
if [[ ! "$deployed_at" =~ ^[0-9T:.+Z-]{10,40}$ ]]; then
  print_failure "200 (but deployed_at is missing or malformed)"
  exit 1
fi

log "deployed_at: ${deployed_at}"
log "app_url: ${app_url}"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    printf 'app_url=%s\n' "$app_url"
    printf 'deployed_at=%s\n' "$deployed_at"
  } >>"$GITHUB_OUTPUT"
fi
