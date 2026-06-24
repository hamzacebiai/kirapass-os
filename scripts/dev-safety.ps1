# KiraPass Dev Process Safety Layer (Windows)
# Targeted, deterministic cleanup for orphan Node/Nest dev servers that block
# port 3000 and lock the Prisma query engine (EPERM). NEVER kills all node;
# only the exact PID owning a port, and only if it is a `node` process.
#
# Usage:
#   powershell -File scripts/dev-safety.ps1 -Action check-port   -Port 3000
#   powershell -File scripts/dev-safety.ps1 -Action find-pid     -Port 3000
#   powershell -File scripts/dev-safety.ps1 -Action kill-pid     -ProcessId 1234
#   powershell -File scripts/dev-safety.ps1 -Action safe-generate

param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('check-port', 'find-pid', 'kill-pid', 'safe-generate')]
  [string]$Action,
  [int]$Port = 3000,
  [int]$ProcessId = 0
)

$ErrorActionPreference = 'Stop'

function Get-ListenerPid([int]$p) {
  $c = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
  if ($c) { return ($c | Select-Object -First 1 -ExpandProperty OwningProcess) }
  return $null
}

function Test-IsNode([int]$id) {
  $proc = Get-Process -Id $id -ErrorAction SilentlyContinue
  return ($null -ne $proc -and $proc.ProcessName -eq 'node')
}

function Stop-NodePid([int]$id) {
  if (-not (Test-IsNode $id)) { throw "Refusing: PID $id is not a 'node' process." }
  Stop-Process -Id $id -Force
  Start-Sleep -Seconds 1
}

switch ($Action) {
  'check-port' {
    $owner = Get-ListenerPid $Port
    if ($owner) {
      $name = (Get-Process -Id $owner -ErrorAction SilentlyContinue).ProcessName
      "PORT ${Port}: BUSY (pid $owner, $name)"
    }
    else { "PORT ${Port}: FREE" }
  }

  'find-pid' {
    $owner = Get-ListenerPid $Port
    if ($owner) { "$owner" } else { "" }
  }

  'kill-pid' {
    if ($ProcessId -le 0) { throw "Provide -ProcessId <pid>." }
    Stop-NodePid $ProcessId
    "killed $ProcessId"
  }

  'safe-generate' {
    $owner = Get-ListenerPid $Port
    if ($owner -and (Test-IsNode $owner)) {
      Write-Host "Orphan node pid $owner on port $Port -> stopping (targeted)."
      Stop-Process -Id $owner -Force
      Start-Sleep -Seconds 1
    }
    & npx prisma generate --schema packages/database/prisma/schema.prisma
    if ($LASTEXITCODE -ne 0) {
      Write-Host "prisma generate failed -> retry once."
      Start-Sleep -Seconds 1
      & npx prisma generate --schema packages/database/prisma/schema.prisma
      if ($LASTEXITCODE -ne 0) {
        $still = Get-ListenerPid $Port
        Write-Error "prisma generate still failing. Port $Port owner pid: $still. Stop it, then retry."
        exit 1
      }
    }
    "prisma generate OK"
  }
}
