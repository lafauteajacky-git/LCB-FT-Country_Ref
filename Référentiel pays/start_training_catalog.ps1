$ErrorActionPreference = "Stop"

$nodeCandidates = @(
  "C:\Users\PC\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe",
  "node"
)

$node = $null
foreach ($candidate in $nodeCandidates) {
  try {
    $resolved = Get-Command $candidate -ErrorAction Stop
    $node = $resolved.Source
    break
  } catch {
  }
}

if (-not $node) {
  throw "Node.js est introuvable."
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverPath = Join-Path $scriptDir "server.js"
Set-Location $scriptDir

Write-Host "Starting country risk demo on http://127.0.0.1:8787"
& $node $serverPath
