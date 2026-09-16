param([switch]$Build)
$ErrorActionPreference = 'Stop'
$vibeRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
. (Join-Path $PSScriptRoot 'init-local.ps1')
$javaCandidates = @((Join-Path $vibeRoot '.tools/jdk-21'), 'C:/Program Files/Java/jdk-21', 'C:/Program Files/Java/jdk-17')
if (!$env:JAVA_HOME) { $env:JAVA_HOME = $javaCandidates | Where-Object { Test-Path (Join-Path $_ 'bin/java.exe') } | Select-Object -First 1 }
if (!$env:JAVA_HOME) { throw 'Set JAVA_HOME to JDK 21 (JDK 17 upstream baseline is also supported).' }
$env:VIBE_RUNTIME_DIR = Join-Path $vibeRoot '.runtime'
if ($Build) {
    $maven = Join-Path $vibeRoot '.tools/apache-maven-3.9.9/bin/mvn.cmd'
    if (!(Test-Path $maven)) { throw 'Portable Maven missing; run tooling/bootstrap/prepare-tools.ps1.' }
    & $maven -B -ntp -s (Join-Path $PSScriptRoot 'maven-settings.xml') -f (Join-Path $vibeRoot 'apps/server/pom.xml') -pl yudao-server -am -DskipTests package
    if ($LASTEXITCODE -ne 0) { throw 'Backend build failed.' }
}
$runJar = Join-Path $env:VIBE_RUNTIME_DIR 'server-run.jar'
& node (Join-Path $PSScriptRoot 'verify-build-freshness.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Backend source and build do not match; rebuild before restarting.' }
Copy-Item -LiteralPath (Join-Path $vibeRoot 'apps/server/yudao-server/target/yudao-server.jar') -Destination $runJar -Force
& (Join-Path $env:JAVA_HOME 'bin/java.exe') -Xms256m -Xmx1536m -jar $runJar --spring.profiles.active=foundation
exit $LASTEXITCODE
