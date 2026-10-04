param([string]$InterfaceAlias='Ethernet', [switch]$SansDialogue)
$ErrorActionPreference='Stop'
try {
  $profile=Get-NetConnectionProfile -InterfaceAlias $InterfaceAlias
  if($profile.NetworkCategory -ne 'Private') { throw 'Le reseau doit etre prive et correspondre au reseau domestique autorise.' }
  $rule='AmesErrantes-Local-4174'
  if(Get-NetFirewallRule -Name $rule -ErrorAction SilentlyContinue) {
    Set-NetFirewallRule -Name $rule -Direction Inbound -Action Allow -Enabled True -Profile Private -Program Any -Protocol TCP -LocalPort 4173,4174 -RemoteAddress LocalSubnet -InterfaceAlias $InterfaceAlias -ErrorAction Stop | Out-Null
  } else {
    New-NetFirewallRule -Name $rule -DisplayName 'Ames errantes - Docker sur le reseau maison' -Direction Inbound -Action Allow -Enabled True -Profile Private -Program Any -Protocol TCP -LocalPort 4173,4174 -RemoteAddress LocalSubnet -InterfaceAlias $InterfaceAlias -ErrorAction Stop | Out-Null
  }
  $applied=Get-NetFirewallRule -Name $rule
  $ports=$applied | Get-NetFirewallPortFilter
  $application=$applied | Get-NetFirewallApplicationFilter
  if($application.Program -ne 'Any' -or '4173' -notin $ports.LocalPort -or '4174' -notin $ports.LocalPort) { throw 'La regle reseau n a pas ete appliquee.' }
  $addresses=Get-NetIPAddress -InterfaceAlias $InterfaceAlias -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike '169.254.*'}
  $lines=@('Sur le PC : http://localhost:4174', 'Site public : http://localhost:4173')
  foreach($address in $addresses) { $lines+="Depuis le Wi-Fi : http://$($address.IPAddress):4174"; $lines+="Site sur le Wi-Fi : http://$($address.IPAddress):4173" }
  $lines | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'data\adresses.txt') -Encoding utf8
  @{success=$true;ports=@(4173,4174);interface=$InterfaceAlias;profile='Private'} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'data\wifi-status.json') -Encoding utf8
  if(-not $SansDialogue) { Write-Host ($lines -join "`n") }
} catch {
  @{success=$false;message=$_.Exception.Message} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'data\wifi-status.json') -Encoding utf8
  Write-Error $_
  exit 1
}
