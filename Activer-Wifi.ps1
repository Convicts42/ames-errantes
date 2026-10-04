param([string]$InterfaceAlias='Ethernet', [switch]$SansDialogue)
& (Join-Path $PSScriptRoot '..\Activer-Wifi.ps1') -InterfaceAlias $InterfaceAlias -SansDialogue:$SansDialogue
