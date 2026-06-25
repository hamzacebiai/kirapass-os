# KiraPass OS — Gate 4 database backup.
# Creates a custom-format pg_dump of the Postgres database running in Docker.
# Auth uses the container's local socket (trust) via `docker exec` — no password
# is embedded. Output: backups/kirapass_<UTC-timestamp>.dump (custom format,
# restorable with scripts/restore.ps1).
#
# Usage:
#   powershell -NoProfile -File scripts/backup.ps1
#   powershell -NoProfile -File scripts/backup.ps1 -Database kirapass_dev

param(
  [string]$Container = "kirapass-postgres",
  [string]$Database  = "kirapass_dev",
  [string]$User      = "postgres"
)

$ErrorActionPreference = "Stop"

$timestamp  = (Get-Date).ToUniversalTime().ToString("yyyyMMdd_HHmmss")
$backupsDir = Join-Path $PSScriptRoot "..\backups"
New-Item -ItemType Directory -Force -Path $backupsDir | Out-Null

$inContainer = "/tmp/kirapass_$timestamp.dump"
$hostFile    = Join-Path $backupsDir "kirapass_$timestamp.dump"

Write-Host "[BACKUP] pg_dump '$Database' (container '$Container') -> $hostFile"
docker exec $Container pg_dump -U $User -F c -f $inContainer $Database
docker cp "${Container}:$inContainer" $hostFile
docker exec $Container rm -f $inContainer

$size = (Get-Item $hostFile).Length
if ($size -le 0) { throw "[BACKUP] FAILED: dump file is empty ($hostFile)" }
Write-Host "[BACKUP] OK: $hostFile ($size bytes)"
