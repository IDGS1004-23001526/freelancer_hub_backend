#!/usr/bin/env bash
# Levanta todo lo necesario y ejecuta la suite automática de disponibilidad y funcionalidad.
#
#   bash scripts/run-tests.sh            # una ejecución + reporte
#   bash scripts/run-tests.sh --loop     # repite cada SLA_INTERVAL_SECONDS (300 por defecto) hasta Ctrl+C
#   bash scripts/run-tests.sh --clean    # borra logs/sla antes de empezar
#
# Pasos: 1) Postgres (Podman, puerto 5433)  2) esquema Prisma  3) backend :4000
#        4) frontend :5173  5) suite (logs/sla/*.jsonl)  6) reporte histórico
# Los servicios que este script arranca se detienen al terminar; los que ya estaban corriendo se dejan igual.
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$(cd "$BACKEND_DIR/../freelancer_hub_frontend" && pwd)"
DB_CONTAINER="freelancer_hub_db_5433"
DB_PORT=5433
API_URL="http://localhost:4000/api"
WEB_URL="http://localhost:5173"
RUN_LOG_DIR="$BACKEND_DIR/logs/sla/run"
LOOP=false
CLEAN=false

for arg in "$@"; do
    case "$arg" in
        --loop) LOOP=true ;;
        --clean) CLEAN=true ;;
        *) echo "Opción desconocida: $arg"; exit 2 ;;
    esac
done

STARTED_PIDS=()
cleanup() {
    for pid in "${STARTED_PIDS[@]:-}"; do
        [ -n "$pid" ] && kill "$pid" 2>/dev/null || true
    done
}
trap cleanup EXIT INT TERM

wait_for() {
    local url="$1" name="$2"
    for _ in $(seq 1 60); do
        curl -s -o /dev/null "$url" && { echo "  $name listo"; return 0; }
        sleep 1
    done
    echo "  ERROR: $name no respondió en 60 s ($url)"
    exit 1
}

cd "$BACKEND_DIR"
mkdir -p "$RUN_LOG_DIR"
$CLEAN && rm -f logs/sla/*.jsonl && echo "Logs anteriores borrados."

DB_PASSWORD="$(grep -E '^DATABASE_URL' .env | sed -E 's#.*://[^:]+:([^@]+)@.*#\1#')"
export DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@localhost:${DB_PORT}/freelancer_hub?schema=public"

echo "1) Base de datos"
if ! podman container exists "$DB_CONTAINER"; then
    podman run -d --name "$DB_CONTAINER" \
        -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD="$DB_PASSWORD" -e POSTGRES_DB=freelancer_hub \
        -p "${DB_PORT}:5432" -v freelancer_hub_pgdata:/var/lib/postgresql/data \
        docker.io/library/postgres:16-alpine >/dev/null
fi
podman start "$DB_CONTAINER" >/dev/null
for _ in $(seq 1 30); do podman exec "$DB_CONTAINER" pg_isready -U postgres -q && break; sleep 1; done
echo "  Postgres listo en :$DB_PORT"

echo "2) Esquema"
npx prisma db push --skip-generate >/dev/null && echo "  Esquema sincronizado"

echo "3) Backend"
if curl -s -o /dev/null "$API_URL/health"; then
    echo "  Ya estaba corriendo (si las pruebas fallan con 429, reinícialo con AUTH_RATE_LIMIT_MAX=200)"
else
    AUTH_RATE_LIMIT_MAX=200 pnpm dev > "$RUN_LOG_DIR/backend.log" 2>&1 &
    STARTED_PIDS+=($!)
    wait_for "$API_URL/health" "Backend"
fi

echo "4) Frontend"
if curl -s -o /dev/null "$WEB_URL"; then
    echo "  Ya estaba corriendo"
else
    (cd "$FRONTEND_DIR" && VITE_API_URL="$API_URL" npm run dev -- --host localhost --port 5173 > "$RUN_LOG_DIR/frontend.log" 2>&1) &
    STARTED_PIDS+=($!)
    wait_for "$WEB_URL" "Frontend"
fi

run_once() {
    echo
    echo "5) Suite automática  $(date '+%Y-%m-%d %H:%M:%S')"
    API_URL="$API_URL" WEB_URL="$WEB_URL" npx tsx tests/sla/sla-suite.ts || true
    echo
    echo "6) Reporte histórico"
    npx tsx tests/sla/sla-report.ts
}

if $LOOP; then
    interval="${SLA_INTERVAL_SECONDS:-300}"
    echo "Modo continuo: cada ${interval}s. Ctrl+C para terminar."
    while true; do
        run_once
        sleep "$interval"
    done
else
    run_once
fi
