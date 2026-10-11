# Builds the distributable ZIP for a GitHub Release.
# Usage:  powershell -ExecutionPolicy Bypass -File package.ps1
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$dist = Join-Path $root "dist"
New-Item -ItemType Directory -Force -Path $dist | Out-Null

$zip = Join-Path $dist "right-click-save-png.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }

Compress-Archive -Path (Join-Path $root "manifest.json"), (Join-Path $root "background.js"), (Join-Path $root "icons") -DestinationPath $zip

Write-Output "Built: $zip"
