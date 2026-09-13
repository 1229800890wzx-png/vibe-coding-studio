$ErrorActionPreference='Stop'
$runtime=Join-Path $env:LOCALAPPDATA 'CodexEducation/runtime'
$dbPassword=(Get-Content (Join-Path $runtime 'database-secret.txt') -Raw).Trim()
$source=Join-Path $PSScriptRoot 'vendor/ruoyi-vue-pro-8e43004cf68a405cd3485f98f8a539b97ca6544a'
$properties=@"
server.port=48080
server.address=127.0.0.1
spring.datasource.dynamic.datasource.master.url=jdbc:mysql://127.0.0.1:3308/education?useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&nullCatalogMeansCurrent=true
spring.datasource.dynamic.datasource.master.username=root
spring.datasource.dynamic.datasource.master.password=$dbPassword
spring.datasource.dynamic.datasource.slave.url=jdbc:mysql://127.0.0.1:3308/education?useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&nullCatalogMeansCurrent=true
spring.datasource.dynamic.datasource.slave.username=root
spring.datasource.dynamic.datasource.slave.password=$dbPassword
spring.data.redis.host=127.0.0.1
spring.data.redis.port=6388
spring.data.redis.password=$dbPassword
yudao.security.mock-enable=false
yudao.tenant.enable=false
yudao.captcha.enable=false
spring.quartz.auto-startup=false
justauth.enabled=false
spring.boot.admin.client.enabled=false
logging.file.name=$($runtime.Replace('\','/'))/backend.log
"@
$config=Join-Path $runtime 'application-education.properties'
$properties | Set-Content $config
$jar=Join-Path $source 'yudao-server/target/yudao-server.jar'
if(!(Test-Path $jar)){throw 'Compile backend first'}
if(Get-NetTCPConnection -LocalPort 48080 -State Listen -ErrorAction SilentlyContinue){throw 'Port 48080 already in use'}
Start-Process java -ArgumentList @('-Xmx768m','-Dfile.encoding=UTF-8','-jar',('"'+$jar+'"'),'--spring.profiles.active=local,education',('--spring.config.additional-location=file:'+$runtime.Replace('\','/')+'/')) -WorkingDirectory $runtime -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtime 'backend-stdout.log') -RedirectStandardError (Join-Path $runtime 'backend-stderr.log')
Write-Output 'Backend starting at 127.0.0.1:48080; logs in local application data CodexEducation/runtime.'
