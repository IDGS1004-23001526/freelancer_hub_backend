#!/usr/bin/env bash
# Script para levantar la base de datos PostgreSQL de FreelancerHub en Podman (Linux)

set -e

CONTAINER_NAME="freelancer_hub_db"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
DB_NAME="${POSTGRES_DB:-freelancer_hub}"
DB_PORT="${POSTGRES_PORT:-5432}"
VOLUME_NAME="freelancer_hub_pgdata"

echo "Verificando contenedor Podman '$CONTAINER_NAME'..."

if ! command -v podman &> /dev/null; then
  echo "Error: Podman no esta instalado en el sistema."
  exit 1
fi

if ! podman volume exists "$VOLUME_NAME"; then
  echo "Creando volumen persistente '$VOLUME_NAME'..."
  podman volume create "$VOLUME_NAME"
fi

if podman container exists "$CONTAINER_NAME"; then
  STATUS=$(podman inspect -f '{{.State.Status}}' "$CONTAINER_NAME")
  if [ "$STATUS" = "running" ]; then
    echo "El contenedor '$CONTAINER_NAME' ya esta en ejecucion en el puerto $DB_PORT."
  else
    echo "Iniciando contenedor existente '$CONTAINER_NAME'..."
    podman start "$CONTAINER_NAME"
    echo "Base de datos iniciada en localhost:$DB_PORT."
  fi
else
  echo "Creando y levantando contenedor PostgreSQL 16 en Podman..."
  podman run -d \
    --name "$CONTAINER_NAME" \
    -e POSTGRES_USER="$DB_USER" \
    -e POSTGRES_PASSWORD="$DB_PASSWORD" \
    -e POSTGRES_DB="$DB_NAME" \
    -p "$DB_PORT:5432" \
    -v "$VOLUME_NAME:/var/lib/postgresql/data:Z" \
    docker.io/library/postgres:16-alpine

  echo "Base de datos '$DB_NAME' creada y corriendo en postgresql://$DB_USER:$DB_PASSWORD@localhost:$DB_PORT/$DB_NAME?schema=public"
fi
