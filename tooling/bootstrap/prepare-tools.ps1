param([switch]$Jdk21)
$ErrorActionPreference = 'Stop'
$vibeRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$vibeTools = Join-Path $vibeRoot '.tools'
New-Item -ItemType Directory -Force $vibeTools | Out-Null
$mavenVersion = '3.9.9'
if (!(Test-Path (Join-Path $vibeTools "apache-maven-$mavenVersion/bin/mvn.cmd"))) {
    $archive = Join-Path $vibeTools 'maven.zip'
    Invoke-WebRequest "https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/$mavenVersion/apache-maven-$mavenVersion-bin.zip" -OutFile $archive
    $expected = (Invoke-WebRequest "https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/$mavenVersion/apache-maven-$mavenVersion-bin.zip.sha512").Content.Trim()
    if ((Get-FileHash $archive -Algorithm SHA512).Hash.ToLowerInvariant() -ne $expected.ToLowerInvariant()) { throw 'Maven checksum mismatch.' }
    Expand-Archive -LiteralPath $archive -DestinationPath $vibeTools -Force
}
& npm install --prefix $vibeTools --no-audit --no-fund mysql2@3.14.5 bcryptjs@3.0.2
if ($LASTEXITCODE -ne 0) { throw 'Bootstrap Node dependencies failed.' }
if ($Jdk21 -and !(Test-Path (Join-Path $vibeTools 'jdk-21/bin/java.exe'))) {
    $jdkArchive = Join-Path $vibeTools 'jdk21.zip'
    $jdkVersion = '21.0.12.9.1'
    $jdkHash = 'a85f5430ff621668cc682438e2eb54e3466d57112afb97b8a724005588852c22'
    if (!(Test-Path $jdkArchive) -or (Get-FileHash $jdkArchive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $jdkHash) {
        & curl.exe --location --continue-at - --retry 5 --retry-all-errors --retry-delay 2 --connect-timeout 30 --output $jdkArchive "https://corretto.aws/downloads/resources/$jdkVersion/amazon-corretto-$jdkVersion-windows-x64-jdk.zip"
        if ($LASTEXITCODE -ne 0) { throw 'JDK 21 download incomplete; rerun to resume.' }
    }
    if ((Get-FileHash $jdkArchive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $jdkHash) { throw 'JDK 21 checksum mismatch; archive was preserved for inspection.' }
    $jdkExtract = Join-Path $vibeTools 'jdk21-extract'
    Expand-Archive -LiteralPath $jdkArchive -DestinationPath $jdkExtract -Force
    $jdkSource = Get-ChildItem -LiteralPath $jdkExtract -Directory | Where-Object { Test-Path (Join-Path $_.FullName 'bin/java.exe') } | Select-Object -First 1
    $jdkTarget = [IO.Path]::GetFullPath((Join-Path $vibeTools 'jdk-21'))
    if (!$jdkSource -or !$jdkSource.FullName.StartsWith([IO.Path]::GetFullPath($jdkExtract) + [IO.Path]::DirectorySeparatorChar) -or !$jdkTarget.StartsWith($vibeTools + [IO.Path]::DirectorySeparatorChar)) { throw 'Unexpected JDK archive path.' }
    Move-Item -LiteralPath $jdkSource.FullName -Destination $jdkTarget
}
Write-Host 'Portable Maven and bootstrap Node dependencies ready. Set JAVA_HOME to a local JDK 21 or JDK 17.'
