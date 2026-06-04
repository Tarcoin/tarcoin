#!/usr/bin/env bash
# =============================================================================
# TARCOIN – Health Check Script
# Usage : bash devops/scripts/health-check.sh
#         bash devops/scripts/health-check.sh --watch
# Exit  : 0 = all healthy, 1 = one or more failed
# =============================================================================
set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# ── Defaults ──────────────────────────────────────────────────────────────────
WATCH_MODE=false
WATCH_INTERVAL=30
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/docker/.env"

# Load env for RPC credentials
if [[ -f "${ENV_FILE}" ]]; then
    # shellcheck disable=SC1090
    set -a; source "${ENV_FILE}"; set +a
fi

RPC_USER="${RPC_USER:-tarcoin}"
RPC_PASSWORD="${RPC_PASSWORD:-}"
RPC_HOST="localhost"
RPC_PORT="19332"

# ── Usage ─────────────────────────────────────────────────────────────────────
usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Options:
  --watch      Run continuously every ${WATCH_INTERVAL} seconds
  -h, --help   Show this help

Exit codes:
  0 = All services healthy
  1 = One or more services failed
EOF
    exit 0
}

# ── Argument parsing ──────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case "$1" in
        --watch)     WATCH_MODE=true; shift ;;
        -h|--help)   usage ;;
        *)           echo "Unknown argument: $1"; usage ;;
    esac
done

# =============================================================================
# Check Functions
# =============================================================================

# Returns: exit_code, response_time_ms, detail_message
http_check() {
    local name="$1" url="$2" expected_code="${3:-200}"
    local start end elapsed http_code

    start=$(date +%s%3N)
    http_code=$(curl -s -o /dev/null -w "%{http_code}" \
        --connect-timeout 5 --max-time 15 "${url}" 2>/dev/null || echo "000")
    end=$(date +%s%3N)
    elapsed=$(( end - start ))

    if [[ "${http_code}" == "${expected_code}" || "${http_code}" == "200" && "${expected_code}" == "2xx" ]]; then
        echo "OK|${elapsed}|HTTP ${http_code}"
        return 0
    else
        echo "FAIL|${elapsed}|HTTP ${http_code} (expected ${expected_code})"
        return 1
    fi
}

check_tarcoind() {
    local start end elapsed response blocks connections

    start=$(date +%s%3N)
    response=$(curl -s --connect-timeout 5 --max-time 10 \
        -u "${RPC_USER}:${RPC_PASSWORD}" \
        --data '{"jsonrpc":"1.0","id":"health","method":"getblockchaininfo","params":[]}' \
        "http://${RPC_HOST}:${RPC_PORT}" 2>/dev/null || echo "")
    end=$(date +%s%3N)
    elapsed=$(( end - start ))

    if echo "${response}" | grep -q '"result"'; then
        blocks=$(echo "${response}" | grep -o '"blocks":[0-9]*' | cut -d: -f2 || echo "?")
        connections_resp=$(curl -s --connect-timeout 5 --max-time 10 \
            -u "${RPC_USER}:${RPC_PASSWORD}" \
            --data '{"jsonrpc":"1.0","id":"health","method":"getnetworkinfo","params":[]}' \
            "http://${RPC_HOST}:${RPC_PORT}" 2>/dev/null || echo "")
        connections=$(echo "${connections_resp}" | grep -o '"connections":[0-9]*' | cut -d: -f2 || echo "?")
        echo "OK|${elapsed}|block=${blocks} peers=${connections}"
        return 0
    else
        echo "FAIL|${elapsed}|RPC not responding"
        return 1
    fi
}

check_redis() {
    local start end elapsed response

    start=$(date +%s%3N)
    response=$(docker compose -f "${PROJECT_ROOT}/docker/docker-compose.yml" \
        exec -T redis redis-cli ping 2>/dev/null | tr -d '\r' || echo "")
    end=$(date +%s%3N)
    elapsed=$(( end - start ))

    if [[ "${response}" == "PONG" ]]; then
        echo "OK|${elapsed}|PONG"
        return 0
    else
        echo "FAIL|${elapsed}|Expected PONG, got: ${response:-no response}"
        return 1
    fi
}

print_result() {
    local name="$1" result="$2"
    local status elapsed detail
    IFS='|' read -r status elapsed detail <<< "${result}"

    local icon color
    if [[ "${status}" == "OK" ]]; then
        icon="✓"; color="${GREEN}"
    else
        icon="✗"; color="${RED}"
    fi

    printf "  ${color}%s${NC}  %-28s  %5s ms  %s\n" \
        "${icon}" "${name}" "${elapsed}" "${detail}"
}

# =============================================================================
# Main check loop
# =============================================================================

run_checks() {
    local overall_ok=true

    echo ""
    echo -e "${BOLD}${CYAN}══════ TARCOIN Health Check – $(date '+%Y-%m-%d %H:%M:%S') ══════${NC}"
    echo ""
    printf "  %-5s  %-28s  %8s  %s\n" "St" "Service" "Latency" "Details"
    echo "  ──────────────────────────────────────────────────────────────────"

    # tarcoind RPC
    result=$(check_tarcoind 2>/dev/null) && rc=0 || rc=1
    print_result "tarcoind (RPC)" "${result}"
    [[ ${rc} -ne 0 ]] && overall_ok=false

    # Explorer backend
    result=$(http_check "explorer-backend" "http://localhost:4000/health") && rc=0 || rc=1
    print_result "explorer-backend" "${result}"
    [[ ${rc} -ne 0 ]] && overall_ok=false

    # Explorer frontend
    result=$(http_check "explorer-frontend" "http://localhost:4001") && rc=0 || rc=1
    print_result "explorer-frontend" "${result}"
    [[ ${rc} -ne 0 ]] && overall_ok=false

    # API server
    result=$(http_check "api-server" "http://localhost:5000/health") && rc=0 || rc=1
    print_result "api-server" "${result}"
    [[ ${rc} -ne 0 ]] && overall_ok=false

    # Mining pool
    result=$(http_check "mining-pool" "http://localhost:3001/health") && rc=0 || rc=1
    print_result "mining-pool" "${result}"
    [[ ${rc} -ne 0 ]] && overall_ok=false

    # Website
    result=$(http_check "website" "http://localhost:3000") && rc=0 || rc=1
    print_result "website" "${result}"
    [[ ${rc} -ne 0 ]] && overall_ok=false

    # Redis
    result=$(check_redis 2>/dev/null) && rc=0 || rc=1
    print_result "redis" "${result}"
    [[ ${rc} -ne 0 ]] && overall_ok=false

    # Prometheus
    result=$(http_check "prometheus" "http://localhost:9090/-/healthy") && rc=0 || rc=1
    print_result "prometheus" "${result}"
    [[ ${rc} -ne 0 ]] && overall_ok=false

    # Grafana
    result=$(http_check "grafana" "http://localhost:3002/api/health") && rc=0 || rc=1
    print_result "grafana" "${result}"
    [[ ${rc} -ne 0 ]] && overall_ok=false

    echo ""
    if [[ "${overall_ok}" == true ]]; then
        echo -e "  ${GREEN}${BOLD}All services healthy ✓${NC}"
        echo ""
        return 0
    else
        echo -e "  ${RED}${BOLD}One or more services are unhealthy ✗${NC}"
        echo ""
        return 1
    fi
}

# =============================================================================
# Entry point
# =============================================================================

if [[ "${WATCH_MODE}" == true ]]; then
    echo -e "${CYAN}Watch mode active – refreshing every ${WATCH_INTERVAL}s (Ctrl+C to stop)${NC}"
    while true; do
        clear
        run_checks
        echo -e "${YELLOW}Next check in ${WATCH_INTERVAL}s …${NC}"
        sleep "${WATCH_INTERVAL}"
    done
else
    run_checks
fi
