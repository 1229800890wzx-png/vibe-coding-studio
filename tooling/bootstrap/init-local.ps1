param([switch]$StartServices, [string]$WslDistro)
$ErrorActionPreference = 'Stop'
$vibeRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$runtime = Join-Path $vibeRoot '.runtime'
New-Item -ItemType Directory -Force $runtime | Out-Null
$envFile = Join-Path $runtime 'foundation.env'
if (!(Test-Path -LiteralPath $envFile)) {
    $dbSecret = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(24))
    $rootSecret = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(24))
    $adminSecret = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(8))
    $memberSecret = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(8))
    @("VIBE_DB_PASSWORD=$dbSecret", "VIBE_DB_ROOT_PASSWORD=$rootSecret", "VIBE_ADMIN_PASSWORD=$adminSecret", "VIBE_MEMBER_PASSWORD=$memberSecret") | Set-Content -LiteralPath $envFile -Encoding utf8
}
foreach ($line in Get-Content -LiteralPath $envFile) {
    if ($line -match '^([A-Z_]+)=(.*)$') { [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process') }
}
if ($StartServices) {
    if ($WslDistro) {
        # Systemd services alone do not keep a WSL distribution alive after a command exits.
        $keepAliveFile = Join-Path $runtime 'wsl-keepalive.pid'
        $keepAlive = if (Test-Path $keepAliveFile) { Get-Process -Id ([int](Get-Content $keepAliveFile)) -ErrorAction SilentlyContinue } else { $null }
        if (!$keepAlive -or $keepAlive.ProcessName -ne 'wsl') {
            $keepAlive = Start-Process -FilePath 'wsl.exe' -ArgumentList @('-d', $WslDistro, '-u', 'root', '--', 'sleep', 'infinity') -WindowStyle Hidden -PassThru
            Set-Content -LiteralPath $keepAliveFile -Value $keepAlive.Id
        }
        $wslRootResult = & wsl -d $WslDistro -u root -- wslpath -a ($vibeRoot.Replace('\', '/'))
        if ($LASTEXITCODE -ne 0) { throw 'Unable to translate workspace into the requested WSL distro.' }
        $wslRoot = ($wslRootResult | Select-Object -Last 1).Trim()
        & wsl -d $WslDistro -u root -- docker compose --env-file "$wslRoot/.runtime/foundation.env" -f "$wslRoot/infra/docker-compose.yml" up -d --wait
    } else {
        & docker compose --env-file $envFile -f (Join-Path $vibeRoot 'infra/docker-compose.yml') up -d --wait
    }
    if ($LASTEXITCODE -ne 0) { throw 'Docker services failed. Existing volumes were preserved.' }
}
Write-Host "Local environment prepared at $envFile (ignored). Ports: MySQL 13306, Redis 16379, API 48080."
