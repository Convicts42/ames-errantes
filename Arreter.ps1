$ErrorActionPreference = 'Stop'
$appRoot = [System.IO.Path]::GetFullPath($PSScriptRoot)
$pidFile = Join-Path $appRoot 'data\server.pid'
if (-not (Test-Path -LiteralPath $pidFile)) { exit 0 }
$serverProcessId = [int](Get-Content -LiteralPath $pidFile)
$serverProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $serverProcessId"
if (-not $serverProcess) { exit 0 }
$expectedScript = Join-Path $appRoot 'node_modules\next\dist\bin\next'
# Never stop another process if Windows has reused the recorded process ID.
if ($serverProcess.CommandLine -and $serverProcess.CommandLine.Replace('/', '\').Contains($expectedScript) -and $serverProcess.CommandLine -match '--port\s+4174') {
    [System.Diagnostics.Process]::GetProcessById($serverProcessId).Kill()
    Remove-Item -LiteralPath $pidFile
} else {
    throw "Ce processus ne correspond pas au serveur de cet espace. Aucun programme n’a été arrêté."
}
