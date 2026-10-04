param([ValidateSet('start','stop','backup','status','test')][string]$Action='start')
$ErrorActionPreference='Stop'
Set-Location -LiteralPath $PSScriptRoot
if ((Test-Path -LiteralPath (Join-Path $PSScriptRoot 'deploy/raspberry/active.json')) -and $Action -ne 'test') {
  & node (Join-Path $PSScriptRoot 'scripts/raspberry.mjs') $Action
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  if ($Action -eq 'start') { Write-Host 'Intranet : http://192.168.1.153:4174'; Write-Host 'Site : http://192.168.1.153:4173' }
  exit 0
}
$candidates=@("$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin\docker.exe", "$env:ProgramFiles\Docker\Docker\resources\bin\docker.exe")
$docker=$candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if(-not $docker) { throw 'Docker Desktop est introuvable. Installez-le puis relancez ce fichier.' }
& $docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
if($LASTEXITCODE -ne 0) {
  $desktop=Join-Path (Split-Path (Split-Path $docker -Parent) -Parent) 'Docker Desktop.exe'
  if(Test-Path -LiteralPath $desktop) { Start-Process -FilePath $desktop -WindowStyle Hidden }
  Write-Host 'Demarrage de Docker Desktop...'
  $ready=$false
  for($attempt=0; $attempt -lt 20; $attempt++) {
    Start-Sleep -Seconds 3
    & $docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
    if($LASTEXITCODE -eq 0) { $ready=$true; break }
  }
  if(-not $ready) { throw 'Docker ne repond pas encore. Attendez son demarrage et relancez.' }
}
if(-not (Test-Path -LiteralPath '.env')) {
  if($Action -ne 'start') { throw 'Demarrez une premiere fois la plateforme.' }
  $bytes=New-Object byte[] 32
  $rng=[Security.Cryptography.RandomNumberGenerator]::Create()
  $rng.GetBytes($bytes); $rng.Dispose()
  $secret=([BitConverter]::ToString($bytes)).Replace('-','').ToLowerInvariant()
  [IO.File]::WriteAllText((Join-Path $PSScriptRoot '.env'),"POSTGRES_PASSWORD=$secret`nSITE_PORT=4173`nSPACE_PORT=4174`nPUBLIC_HOST=localhost`nBIND_ADDRESS=0.0.0.0`n")
}
New-Item -ItemType Directory -Force -Path (Join-Path $PSScriptRoot 'data\migration') | Out-Null
switch($Action) {
  start {
    & $docker compose up -d --build --wait
    if($LASTEXITCODE -ne 0) { throw 'Le demarrage a echoue. Les donnees ont ete conservees.' }
    Write-Host 'Espace interne : http://localhost:4174'
    Write-Host 'Site public    : http://localhost:4173'
  }
  stop { & $docker compose stop }
  status { & $docker compose ps }
  test { & $docker compose run --rm --no-deps -v "${PSScriptRoot}/data/migration:/migration:ro" espace node --test /app/tests/platform.test.mjs }
  backup {
    & $docker compose exec -T espace node /app/packages/core/src/backup-command.mjs
    if($LASTEXITCODE -ne 0) { throw 'La sauvegarde a echoue.' }
    $destination=Join-Path $PSScriptRoot ('data\backups-export\'+(Get-Date -Format 'yyyyMMdd-HHmmss'))
    New-Item -ItemType Directory -Path $destination -Force | Out-Null
    & $docker compose cp espace:/data/backups/. $destination
    if($LASTEXITCODE -ne 0) { throw 'La copie de sauvegarde a echoue.' }
    Write-Host "Sauvegardes copiees dans $destination"
  }
}
if($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
