param([int]$Quality = 70)
$ErrorActionPreference = 'Stop'
$vibeRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$vibeSource = Join-Path $vibeRoot '.runtime/course-art-source'
$vibeOutput = Join-Path $vibeRoot 'apps/miniapp/static/edu/courses'
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force $vibeOutput | Out-Null
$vibeCodec = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$vibeParameters = [Drawing.Imaging.EncoderParameters]::new(1)
$vibeParameters.Param[0] = [Drawing.Imaging.EncoderParameter]::new([Drawing.Imaging.Encoder]::Quality, [long]$Quality)
try {
    foreach ($vibeName in @('tools', 'game', 'story', 'web', 'ai', 'product')) {
        $vibeImage = [Drawing.Image]::FromFile((Join-Path $vibeSource ($vibeName + '.png')))
        try {
            if ([Math]::Abs($vibeImage.Width / $vibeImage.Height - 16/9) -gt 0.02) { throw 'Expected a landscape course asset.' }
            # Encoding only: retain the generated dimensions and entire composition.
            $vibeImage.Save((Join-Path $vibeOutput ($vibeName + '.jpg')), $vibeCodec, $vibeParameters)
        } finally { $vibeImage.Dispose() }
    }
} finally { $vibeParameters.Dispose() }
Get-ChildItem -LiteralPath $vibeOutput -File | Select-Object Name, Length
