$ErrorActionPreference = 'Stop'
$taskRoot = $PSScriptRoot
$runtime = Join-Path $env:LOCALAPPDATA 'CodexEducation/runtime'
New-Item -ItemType Directory -Force -Path $runtime | Out-Null
$mysqlData = Join-Path $runtime 'mysql'
$redisData = Join-Path $runtime 'redis'
New-Item -ItemType Directory -Force -Path $redisData | Out-Null
$secretPath = Join-Path $runtime 'database-secret.txt'
if (!(Test-Path $secretPath)) { [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(24)) | Set-Content $secretPath }
$dbPassword = (Get-Content $secretPath -Raw).Trim()
$ini = Join-Path $runtime 'mysql.ini'
@"
[mysqld]
basedir=E:/DevPath/mysql
datadir=$($mysqlData.Replace('\','/'))
port=3308
bind-address=127.0.0.1
mysqlx=0
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
"@ | Set-Content $ini
if (!(Test-Path $mysqlData)) {
  & E:/DevPath/mysql/bin/mysqld.exe "--defaults-file=$ini" --initialize-insecure
  if ($LASTEXITCODE -ne 0) { throw 'MySQL initialization failed' }
}
if (!(Get-NetTCPConnection -LocalPort 3308 -State Listen -ErrorAction SilentlyContinue)) {
  Start-Process E:/DevPath/mysql/bin/mysqld.exe -ArgumentList ('--defaults-file="'+$ini+'"') -WindowStyle Hidden
}
$ready = $false
for($i=0;$i -lt 20;$i++){ if(Get-NetTCPConnection -LocalPort 3308 -State Listen -ErrorAction SilentlyContinue){$ready=$true;break};Start-Sleep -Seconds 1 }
if(!$ready){throw 'MySQL did not start on 3308'}
$client = Join-Path $runtime 'mysql-client.ini'
@"
[client]
host=127.0.0.1
port=3308
user=root
password=$dbPassword
default-character-set=utf8mb4
"@ | Set-Content $client
$marker = Join-Path $runtime 'database-initialized'
if(!(Test-Path $marker)){
  & E:/DevPath/mysql/bin/mysql.exe "--defaults-file=$client" -e 'SELECT 1' *> $null
  if($LASTEXITCODE -ne 0){
    "ALTER USER 'root'@'localhost' IDENTIFIED BY '$dbPassword';" | & E:/DevPath/mysql/bin/mysql.exe --no-defaults '--host=127.0.0.1' '--port=3308' '--user=root'
    if($LASTEXITCODE -ne 0){throw 'Database account setup failed'}
  }
  & E:/DevPath/mysql/bin/mysql.exe "--defaults-file=$client" -e 'CREATE DATABASE IF NOT EXISTS education CHARACTER SET utf8mb4'
  $sql = Join-Path $taskRoot 'vendor/ruoyi-vue-pro-8e43004cf68a405cd3485f98f8a539b97ca6544a/sql/mysql/ruoyi-vue-pro.sql'
  $importFile = Join-Path $runtime 'upstream.sql'
  Copy-Item -LiteralPath $sql -Destination $importFile
  & E:/DevPath/mysql/bin/mysql.exe "--defaults-file=$client" education -e "source $($importFile.Replace('\','/'))"
  if($LASTEXITCODE -ne 0){throw 'Upstream SQL import failed'}
  'ready' | Set-Content $marker
}
if(!(Get-NetTCPConnection -LocalPort 6388 -State Listen -ErrorAction SilentlyContinue)){
  $redisConfig = Join-Path $runtime 'redis.conf'
  "bind 127.0.0.1`nport 6388`ndir $($redisData.Replace('\','/'))`nappendonly yes`nrequirepass $dbPassword" | Set-Content $redisConfig
  Start-Process E:/DevPath/Redis-x64-5.0.14.1/redis-server.exe -ArgumentList ('"'+$redisConfig+'"') -WindowStyle Hidden
}
Write-Output 'Independent education MySQL 3308 and Redis 6388 prepared. Credentials stay in runtime/.'
