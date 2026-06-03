$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$Python = Join-Path $RepoRoot ".venv\Scripts\python.exe"
$Script = Join-Path $PSScriptRoot "process-actor-images.py"

if (-not (Test-Path -LiteralPath $Python)) {
  throw "Project Python was not found: $Python"
}

& $Python $Script @args
exit $LASTEXITCODE
