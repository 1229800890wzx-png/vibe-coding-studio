$ErrorActionPreference = 'Stop'
$taskRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$taskConfig = Get-Content -LiteralPath (Join-Path $taskRoot '.runtime/unified/environment.json') -Raw | ConvertFrom-Json
if ($taskConfig.database -notmatch '^vibe_edu_restore_\d+$') { throw 'Only isolated restore databases may run validation.' }
foreach ($taskLine in Get-Content -LiteralPath (Join-Path $taskRoot '.runtime/foundation.env')) {
  if ($taskLine -match '^([A-Z_]+)=(.*)$') { [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process') }
}
$env:JAVA_HOME = Join-Path $taskRoot '.tools/jdk-21'
$env:VIBE_RUNTIME_DIR = Join-Path $taskRoot '.runtime/unified'
$taskJar = Join-Path $env:VIBE_RUNTIME_DIR 'server-run.jar'
Copy-Item -LiteralPath (Join-Path $taskRoot 'apps/server/yudao-server/target/yudao-server.jar') -Destination $taskJar -Force
& (Join-Path $env:JAVA_HOME 'bin/java.exe') -Xms256m -Xmx1536m -jar $taskJar '--spring.profiles.active=foundation' '--server.port=48081' "--spring.datasource.dynamic.datasource.master.url=jdbc:mysql://127.0.0.1:13306/$($taskConfig.database)?useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&nullCatalogMeansCurrent=true&rewriteBatchedStatements=true" '--spring.data.redis.database=14' '--spring.quartz.auto-startup=false' '--spring.quartz.scheduler-name=vibeUnifiedValidation' '--yudao.pay.order-notify-url=http://127.0.0.1:48081/admin-api/pay/notify/order' '--yudao.pay.refund-notify-url=http://127.0.0.1:48081/admin-api/pay/notify/refund' '--edu.website-admission.create-limit=30'
exit $LASTEXITCODE
