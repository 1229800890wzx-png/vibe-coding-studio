$ErrorActionPreference='Stop'
& (Join-Path $PSScriptRoot 'start-education-data.ps1')
if(!(Get-NetTCPConnection -LocalPort 48080 -State Listen -ErrorAction SilentlyContinue)) { & (Join-Path $PSScriptRoot 'start-education-backend.ps1') }
$admin=Join-Path $PSScriptRoot 'vendor/yudao-ui-admin-vue3-master'
if(!(Get-NetTCPConnection -LocalPort 4180 -State Listen -ErrorAction SilentlyContinue)){
 Start-Process node -ArgumentList @('node_modules/vite/bin/vite.js','preview','--mode','education','--host','127.0.0.1','--port','4180') -WorkingDirectory $admin -WindowStyle Hidden -RedirectStandardOutput (Join-Path $admin 'admin-preview.log') -RedirectStandardError (Join-Path $admin 'admin-preview-error.log')
}
$frontend=Split-Path $PSScriptRoot -Parent
if(!(Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue)){
 Start-Process node -ArgumentList @('scripts/serve.mjs') -WorkingDirectory $frontend -WindowStyle Hidden
}
Write-Output 'Website: http://127.0.0.1:4173/ | Admin: http://127.0.0.1:4180/education/manage'
