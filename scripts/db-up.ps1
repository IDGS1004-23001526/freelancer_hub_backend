# Script PowerShell para levantar la base de datos PostgreSQL de FreelancerHub en Podman (Windows)

$ErrorActionPreference = "Stop"

$ContainerName = "freelancer_hub_db"
$DbUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "postgres" }
$DbPassword = if ($env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD } else { "postgres" }
$DbName = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "freelancer_hub" }
$DbPort = if ($env:POSTGRES_PORT) { $env:POSTGRES_PORT } else { "5432" }
$VolumeName = "freelancer_hub_pgdata"

Write-Host "Verificando Podman y el contenedor '$ContainerName'..."

if (-not (Get-Command podman -ErrorAction SilentlyContinue)) {
    Write-Error "Error: Podman no esta instalado o no se encuentra en el PATH de Windows."
    exit 1
}

$machineStatus = podman machine info --format "{{.Host.MachineState}}" 2>$null
if ($LASTEXITCODE -eq 0 -and $machineStatus -ne "Running") {
    Write-Host "Iniciando Podman Machine en Windows..."
    podman machine start
}

podman volume exists $VolumeName 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creando volumen persistente '$VolumeName'..."
    podman volume create $VolumeName | Out-Null
}

podman container exists $ContainerName 2>$null
if ($LASTEXITCODE -eq 0) {
    $status = podman inspect -f "{{.State.Status}}" $ContainerName
    if ($status -eq "running") {
        Write-Host "El contenedor '$ContainerName' ya esta en ejecucion en el puerto $DbPort."
    } else {
        Write-Host "Iniciando contenedor existente '$ContainerName'..."
        podman start $ContainerName | Out-Null
        Write-Host "Base de datos iniciada en localhost:$DbPort."
    }
} else {
    Write-Host "Creando y levantando contenedor PostgreSQL 16 en Podman..."
    podman run -d `
        --name $ContainerName `
        -e POSTGRES_USER=$DbUser `
        -e POSTGRES_PASSWORD=$DbPassword `
        -e POSTGRES_DB=$DbName `
        -p "${DbPort}:5432" `
        -v "${VolumeName}:/var/lib/postgresql/data" `
        docker.io/library/postgres:16-alpine

    Write-Host "Base de datos '$DbName' creada y corriendo en postgresql://${DbUser}:${DbPassword}@localhost:${DbPort}/${DbName}?schema=public"
}
