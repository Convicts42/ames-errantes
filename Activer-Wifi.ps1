# Requires an explicit choice to trust the home's Ethernet network.
# Run with administrator rights after the user has approved this change.
param([string]$InterfaceAlias = 'Ethernet', [switch]$SansDialogue)
$ErrorActionPreference = 'Stop'
$ruleName = 'AmesErrantes-Local-4174'
$changedProfile = $false
$createdRule = $false
try {
    $profile = Get-NetConnectionProfile -InterfaceAlias $InterfaceAlias
    if (-not $profile -or $profile.NetworkCategory -eq 'DomainAuthenticated') {
        throw 'Le réseau domestique attendu est introuvable ou géré par une organisation.'
    }
    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    $nodeExecutable = if ($nodeCommand) { $nodeCommand.Source } else { Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' }
    if (-not (Test-Path -LiteralPath $nodeExecutable)) { throw 'Node.js est introuvable.' }
    # Resolve NVM/junction paths to the executable used by the real server.
    $nodeExecutable = (& $nodeExecutable -p 'process.execPath').Trim()
    $pidFile = Join-Path $PSScriptRoot 'data\server.pid'
    if (Test-Path -LiteralPath $pidFile) {
        $serverProcessId = [int](Get-Content -LiteralPath $pidFile)
        $serverProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $serverProcessId"
        $expectedScript = Join-Path $PSScriptRoot 'node_modules\next\dist\bin\next'
        if ($serverProcess.CommandLine -and $serverProcess.CommandLine.Replace('/', '\').Contains($expectedScript)) {
            $nodeExecutable = $serverProcess.ExecutablePath
        }
    }
    if ($profile.NetworkCategory -eq 'Public') {
        Set-NetConnectionProfile -InterfaceIndex $profile.InterfaceIndex -NetworkCategory Private
        $changedProfile = $true
    }
    $existingRule = Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue
    if ($existingRule) {
        Set-NetFirewallRule -Name $ruleName -Direction Inbound -Action Allow -Enabled True -Profile Private -Program $nodeExecutable -Protocol TCP -LocalPort 4174 -RemoteAddress LocalSubnet -InterfaceAlias $InterfaceAlias | Out-Null
    } else {
        New-NetFirewallRule -Name $ruleName -DisplayName 'Âmes errantes - espace privé sur le réseau maison' -Direction Inbound -Action Allow -Enabled True -Profile Private -Program $nodeExecutable -Protocol TCP -LocalPort 4174 -RemoteAddress LocalSubnet -InterfaceAlias $InterfaceAlias | Out-Null
        $createdRule = $true
    }
    $nodeExecutable | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'data\node-path.txt') -Encoding UTF8
    @{ success = $true; interface = $InterfaceAlias; profile = 'Private'; port = 4174; program = $nodeExecutable } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'data\wifi-status.json') -Encoding UTF8
    if (-not $SansDialogue) {
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.MessageBox]::Show("L’espace est autorisé sur le réseau privé de la maison. Utilisez l’adresse indiquée dans data/adresses.txt depuis le téléphone ou le PC de votre mère.", 'Âmes errantes') | Out-Null
    }
} catch {
    if ($createdRule) { Remove-NetFirewallRule -Name $ruleName }
    if ($changedProfile) { Set-NetConnectionProfile -InterfaceIndex $profile.InterfaceIndex -NetworkCategory Public }
    @{ success = $false; message = $_.Exception.Message } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'data\wifi-status.json') -Encoding UTF8
    if (-not $SansDialogue) {
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'Âmes errantes - accès réseau non activé') | Out-Null
    }
    exit 1
}
