# Generates Android launcher icons from assets/vendorappicon.png
# - ic_launcher.png        : full square image
# - ic_launcher_round.png  : circular crop with transparency
Add-Type -AssemblyName System.Drawing

$src = Join-Path $PSScriptRoot "..\assets\vendorappicon.png"
if (-not (Test-Path $src)) { Write-Error "Source icon not found: $src"; exit 1 }
$source = [System.Drawing.Image]::FromFile($src)
Write-Host "Source: $($source.Width)x$($source.Height)"

$densities = @{
  "mipmap-mdpi"    = 48
  "mipmap-hdpi"    = 72
  "mipmap-xhdpi"   = 96
  "mipmap-xxhdpi"  = 144
  "mipmap-xxxhdpi" = 192
}

foreach ($d in $densities.Keys) {
  $size = $densities[$d]
  $resDir = Join-Path $PSScriptRoot "..\android\app\src\main\res\$d"
  if (-not (Test-Path $resDir)) { New-Item -ItemType Directory -Path $resDir | Out-Null }

  # --- square launcher ---
  $square = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($square)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.DrawImage($source, 0, 0, $size, $size)
  $g.Dispose()
  $square.Save((Join-Path $resDir "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $square.Dispose()

  # --- round launcher (circular clip) ---
  $round = New-Object System.Drawing.Bitmap($size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb))
  $g = [System.Drawing.Graphics]::FromImage($round)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddEllipse(0, 0, $size, $size)
  $g.SetClip($path)
  $g.DrawImage($source, 0, 0, $size, $size)
  $g.Dispose()
  $path.Dispose()
  $round.Save((Join-Path $resDir "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $round.Dispose()

  Write-Host "$d -> ${size}px square + round"
}

$source.Dispose()
Write-Host "Done."
