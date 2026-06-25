# KiraPass OS — Gate 4 database restore (runbook + script).
# Restores a custom-format pg_dump file (from scripts/backup.ps1) into a target
# database in the Docker Postgres container.
#
# SAFETY: by default restores into a SCRATCH database (kirapass_restore_test) so
# the live database is never overwritten. Restoring DROPS and recreates the
# target database — only pass a real database name if you intend to overwrite it.
#
# Usage:
#   powershell -NoProfile -File scripts/restore.ps1 -DumpFile backups/kirapass_<ts>.dump
#   powershell -NoProfile -File scripts/restore.ps1 -DumpFile backups/<f>.dump -TargetDatabase kirapass_dev

param(
  [Parameter(Mandatory=$true)][string]$DumpFile,
  [string]$Container      = "kirapass-postgres",
  [string]$User           = "postgres",
  [string]$TargetDatabase = "kirapass_restore_test"
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path $DumpFile)) { throw "[RESTORE] Dump file not found: $DumpFile" }

$inContainer = "/tmp/restore_input.dump"
docker cp $DumpFile "${Container}:$inContainer"

Write-Host "[RESTORE] Resetting target database '$TargetDatabase' (WARNING: overwrites target)"
docker exec $Container psql -U $User -d postgres -c "DROP DATABASE IF EXISTS $TargetDatabase;"
docker exec $Container psql -U $User -d postgres -c "CREATE DATABASE $TargetDatabase;"

Write-Host "[RESTORE] pg_restore -> '$TargetDatabase'"
docker exec $Container pg_restore -U $User -d $TargetDatabase $inContainer
docker exec $Container rm -f $inContainer

Write-Host "[RESTORE] OK -> '$TargetDatabase'"
