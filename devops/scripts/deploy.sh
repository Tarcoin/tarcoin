#!/usr/bin/env bash
# =============================================================================
# TARCOIN – Deployment Script
# Usage : bash devops/scripts/deploy.sh --env production --service all
#         bash devops/scripts/deploy.sh --env staging --service api --dry-run
# =============================================================================
set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC}  $(date '+%Y-%m-%d %H:%M:%S') $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $(date '+%Y-%m-%d %H:%M:%S') $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $(date '+%Y-%m-%d %H:%M:%S') $*"; }
die()     { echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') $*" >&2; exit 1; }
section() { echo -e "\n${BOLD}${CYAN}══════ $* ══════${NC}"; }

# ── Defaults ──────────────────────────────────────────────────────────────────
ENVIRONMENT=""
TARGET_SERVICE="all"
DRY_RUN=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DOCKER_DIR="${PROJECT_ROOT}/docker"
LOG_DIR="/var/log/tarcoin"
LOG_FILE="${LOG_DIR}/deploy.log"
DEPLOY_WEBHOOK_URL="${DEPLOY_WEBHOOK_URL:-}"
HEALTH_TIMEOUT=120   # seconds to wait for a service to become healthy
GIT_SHA="$(git -C "${PROJECT_ROOT}" rev-parse --short HEAD 2>/dev/null || echo 'unknown')"

# ── Usage ─────────────────────────────────────────────────────────────────────
usage() {
    cat <<EOF
Usage: $(basename "$0") --env <environment> [OPTIONS]

Options:
  --env       production|staging           (required)
  --service   all|tarcoind|explorer|api|pool|website  (default: all)
  --dry-run   Show what would happen without making changes
  -h, --help  Show this help

Examples:
  $(basename "$0") --env production --service all
  $(basename "$0") --env staging --service api
  $(basename "$0") --env production --service all --dry-run
EOF
    exit 0
}

# ── Parse arguments ───────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case "$1" in
        --env)       ENVIRONMENT="$2"; shift 2 ;;
        --service)   TARGET_SERVICE="$2"; shift 2 ;;
        --dry-run)   DRY_RUN=true; shift ;;
        -h|--help)   usage ;;
        *)           die "Unknown argument: $1. Run with --help for usage." ;;
    esac
done

[[ -z "${ENVIRONMENT}" ]] && die "--env is required (production|staging)"
[[ "${ENVIRONMENT}" =~ ^(production|staging)$ ]] || die "Invalid --env: ${ENVIRONMENT}"
[[ "${TARGET_SERVICE}" =~ ^(all|tarcoind|explorer|api|pool|website)$ ]] || \
    die "Invalid --service: ${TARGET_SERVICE}"

# ── Logging setup ─────────────────────────────────────────────────────────────
mkdir -p "${LOG_DIR}"
exec > >(tee -a "${LOG_FILE}") 2>&1

# ── Dry-run wrapper ───────────────────────────────────────────────────────────
run() {
    if [[ "${DRY_RUN}" == true ]]; then
        echo -e "${YELLOW}[DRY-RUN]${NC} $*"
    else
        eval "$@"
    fi
}

# ── Node.js services configuration ───────────────────────────────────────────
declare -A NODE_SERVICES=(
    [explorer]="${PROJECT_ROOT}/explorer"
    [website]="${PROJECT_ROOT}/website"
    [api]="${PROJECT_ROOT}/api"
    [pool]="${PROJECT_ROOT}/mining_pool"
)

# ── Docker Compose services mapping ──────────────────────────────────────────
declare -A DOCKER_SERVICES=(
    [tarcoind]="tarcoind"
    [explorer]="explorer explorer-frontend"
    [api]="api"
    [pool]="pool"
    [website]="website"
)

# ── Health check endpoints ────────────────────────────────────────────────────
declare -A HEALTH_ENDPOINTS=(
    [tarcoind]="http://localhost:19332"
    [explorer]="http://localhost:4000/health"
    [explorer-frontend]="http://localhost:4001"
    [api]="http://localhost:5000/health"
    [pool]="http://localhost:3001/health"
    [website]="http://localhost:3000"
)

# =============================================================================
# Functions
# =============================================================================

load_env() {
    local env_file="${DOCKER_DIR}/.env"
    [[ -f "${env_file}" ]] || die ".env file not found at ${env_file}. Run init-env.sh first."
    # shellcheck disable=SC1090
    set -a; source "${env_file}"; set +a
    info "Environment loaded from ${env_file}"
}

send_notification() {
    local status="$1" message="$2"
    [[ -z "${DEPLOY_WEBHOOK_URL}" ]] && return 0

    local color
    [[ "${status}" == "SUCCESS" ]] && color="3066993" || color="15158332"

    curl -s -X POST "${DEPLOY_WEBHOOK_URL}" \
        -H "Content-Type: application/json" \
        -d "{
            \"embeds\": [{
                \"title\": \"TARCOIN Deploy – ${status}\",
                \"description\": \"${message}\",
                \"color\": ${color},
                \"fields\": [
                    {\"name\": \"Environment\", \"value\": \"${ENVIRONMENT}\", \"inline\": true},
                    {\"name\": \"Service\", \"value\": \"${TARGET_SERVICE}\", \"inline\": true},
                    {\"name\": \"Git SHA\", \"value\": \"\`${GIT_SHA}\`\", \"inline\": true}
                ]
            }]
        }" || warn "Failed to send webhook notification"
}

git_pull() {
    section "Git Pull"
    info "Current HEAD: ${GIT_SHA}"
    run git -C "${PROJECT_ROOT}" fetch --all
    run git -C "${PROJECT_ROOT}" pull --ff-only origin main
    GIT_SHA="$(git -C "${PROJECT_ROOT}" rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
    success "Updated to: ${GIT_SHA}"
}

build_node_service() {
    local svc="$1"
    local svc_dir="${NODE_SERVICES[$svc]:-}"
    [[ -z "${svc_dir}" ]] && return 0
    [[ -d "${svc_dir}" ]] || { warn "Directory not found: ${svc_dir} – skipping npm build"; return 0; }

    section "Build Node.js: ${svc}"
    run "cd '${svc_dir}' && npm ci --prefer-offline"
    run "cd '${svc_dir}' && npm run build"
    success "Node.js build complete: ${svc}"
}

build_docker_image() {
    local svc="$1"
    section "Docker Build: ${svc}"
    run "docker compose -f '${DOCKER_DIR}/docker-compose.yml' build \
        --build-arg GIT_SHA='${GIT_SHA}' \
        --build-arg BUILD_DATE='$(date -Iseconds)' \
        ${svc}"

    # Tag with git SHA for rollback capability
    run "docker tag tarcoin-${svc}:latest tarcoin-${svc}:sha-${GIT_SHA}" 2>/dev/null || true
    success "Docker image built: tarcoin-${svc}:sha-${GIT_SHA}"
}

wait_for_health() {
    local svc="$1"
    local endpoint="${HEALTH_ENDPOINTS[$svc]:-}"
    local deadline=$(( $(date +%s) + HEALTH_TIMEOUT ))

    [[ -z "${endpoint}" ]] && { warn "No health endpoint for ${svc} – skipping check"; return 0; }

    info "Waiting for ${svc} to become healthy (timeout: ${HEALTH_TIMEOUT}s) …"

    while [[ $(date +%s) -lt ${deadline} ]]; do
        if [[ "${svc}" == "tarcoind" ]]; then
            # RPC check
            local resp
            resp=$(curl -s --connect-timeout 5 \
                -u "${RPC_USER:-tarcoin}:${RPC_PASSWORD:-}" \
                --data '{"jsonrpc":"1.0","id":"deploy","method":"getblockchaininfo","params":[]}' \
                "${endpoint}" 2>/dev/null || true)
            if echo "${resp}" | grep -q '"result"'; then
                success "${svc} is healthy (RPC responding)"
                return 0
            fi
        else
            local http_code
            http_code=$(curl -s -o /dev/null -w "%{http_code}" \
                --connect-timeout 5 --max-time 10 "${endpoint}" 2>/dev/null || echo "000")
            if [[ "${http_code}" =~ ^(200|204)$ ]]; then
                success "${svc} is healthy (HTTP ${http_code})"
                return 0
            fi
        fi
        sleep 5
    done

    die "${svc} did not become healthy within ${HEALTH_TIMEOUT}s"
}

rollback_service() {
    local svc="$1" prev_sha="$2"
    warn "Rolling back ${svc} to sha-${prev_sha} …"
    if [[ "${DRY_RUN}" == true ]]; then
        echo -e "${YELLOW}[DRY-RUN]${NC} docker tag tarcoin-${svc}:sha-${prev_sha} tarcoin-${svc}:latest"
        echo -e "${YELLOW}[DRY-RUN]${NC} docker compose restart ${svc}"
        return
    fi
    docker tag "tarcoin-${svc}:sha-${prev_sha}" "tarcoin-${svc}:latest" 2>/dev/null || \
        warn "Previous image sha-${prev_sha} not found for ${svc}"
    docker compose -f "${DOCKER_DIR}/docker-compose.yml" up -d --no-deps "${svc}"
    success "Rolled back ${svc} to sha-${prev_sha}"
}

deploy_service() {
    local svc="$1"
    local prev_sha
    prev_sha=$(docker inspect "tarcoin-${svc}:latest" \
        --format '{{index .Config.Labels "git-sha"}}' 2>/dev/null || echo "none")

    section "Deploy Service: ${svc}"
    info "Previous SHA: ${prev_sha:-none}"

    # Build node if applicable
    build_node_service "${svc}" || true

    # Build Docker image
    build_docker_image "${svc}"

    # Rolling restart
    info "Restarting ${svc} …"
    run "docker compose -f '${DOCKER_DIR}/docker-compose.yml' up -d --no-deps '${svc}'"

    # Health check
    if [[ "${DRY_RUN}" == false ]]; then
        if ! wait_for_health "${svc}"; then
            warn "Health check failed – initiating rollback"
            rollback_service "${svc}" "${prev_sha}"
            die "Deployment of ${svc} failed and has been rolled back"
        fi
    fi

    success "Service ${svc} deployed successfully"
}

post_deploy_health_check() {
    section "Post-Deploy Health Check"
    local all_ok=true

    for svc in "${!HEALTH_ENDPOINTS[@]}"; do
        local endpoint="${HEALTH_ENDPOINTS[$svc]}"
        local http_code
        if [[ "${svc}" == "tarcoind" ]]; then
            local resp
            resp=$(curl -s --connect-timeout 5 \
                -u "${RPC_USER:-tarcoin}:${RPC_PASSWORD:-}" \
                --data '{"jsonrpc":"1.0","id":"healthcheck","method":"getblockchaininfo","params":[]}' \
                "${endpoint}" 2>/dev/null || true)
            if echo "${resp}" | grep -q '"result"'; then
                echo -e "  ${GREEN}✓${NC} ${svc}"
            else
                echo -e "  ${RED}✗${NC} ${svc} – RPC not responding"
                all_ok=false
            fi
        else
            http_code=$(curl -s -o /dev/null -w "%{http_code}" \
                --connect-timeout 5 --max-time 10 "${endpoint}" 2>/dev/null || echo "000")
            if [[ "${http_code}" =~ ^(200|204)$ ]]; then
                echo -e "  ${GREEN}✓${NC} ${svc} (HTTP ${http_code})"
            else
                echo -e "  ${RED}✗${NC} ${svc} – HTTP ${http_code} from ${endpoint}"
                all_ok=false
            fi
        fi
    done

    if [[ "${all_ok}" == true ]]; then
        success "All services are healthy"
        return 0
    else
        die "One or more services failed the post-deploy health check"
    fi
}

# =============================================================================
# Main
# =============================================================================
main() {
    echo ""
    echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║       TARCOIN Deployment Script              ║${NC}"
    echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════╝${NC}"
    echo ""
    info "Environment : ${ENVIRONMENT}"
    info "Service     : ${TARGET_SERVICE}"
    info "Git SHA     : ${GIT_SHA}"
    info "Dry-run     : ${DRY_RUN}"
    echo ""

    [[ "${DRY_RUN}" == true ]] && warn "DRY-RUN mode – no changes will be applied"

    load_env
    git_pull

    if [[ "${TARGET_SERVICE}" == "all" ]]; then
        local services_to_deploy=("tarcoind" "explorer" "api" "pool" "website")
    else
        local services_to_deploy=("${TARGET_SERVICE}")
    fi

    for svc in "${services_to_deploy[@]}"; do
        deploy_service "${svc}" || {
            send_notification "FAILED" "Deployment of ${svc} failed at $(date)"
            die "Deployment failed at service: ${svc}"
        }
    done

    if [[ "${DRY_RUN}" == false ]]; then
        post_deploy_health_check
    fi

    echo ""
    success "════════════════════════════════════════════════"
    success "Deployment complete! SHA: ${GIT_SHA}"
    success "Environment: ${ENVIRONMENT}"
    success "Services: ${TARGET_SERVICE}"
    success "════════════════════════════════════════════════"

    send_notification "SUCCESS" "Deployed ${TARGET_SERVICE} to ${ENVIRONMENT} at $(date)"
}

main "$@"
