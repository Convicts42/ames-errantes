param([switch]$SansNavigateur)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
try {
    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    $runtimeFile = Join-Path $PSScriptRoot 'data\node-path.txt'
    $nodeExecutable = if (Test-Path -LiteralPath $runtimeFile) { (Get-Content -LiteralPath $runtimeFile -Raw).Trim() } elseif ($nodeCommand) { $nodeCommand.Source } else { Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' }
    if (-not (Test-Path -LiteralPath $nodeExecutable)) { throw 'Node.js 24 est introuvable. Consultez le fichier README.md.' }
    & $nodeExecutable 'scripts/launch.mjs'
    if ($LASTEXITCODE -ne 0) { throw 'Le démarrage a échoué. Consultez data/server-error.log.' }
    if (-not $SansNavigateur) { Start-Process 'http://localhost:4174' }
} catch {
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'Âmes errantes') | Out-Null
    exit 1
}
