# scripts/brand/brand-image.ps1 v1.2.2
# 品牌图基础工具：源图加载、裁剪、逐级高质量缩放、位图复制、PNG 保存
# 依赖：Windows .NET System.Drawing（无需第三方依赖）

Add-Type -AssemblyName System.Drawing

function Get-BrandSourceBitmap {
  param([string]$Path)
  $full = (Resolve-Path $Path).Path
  $img = [System.Drawing.Image]::FromFile($full)
  $bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.DrawImage($img, 0, 0, $img.Width, $img.Height)
  $g.Dispose()
  $img.Dispose()
  return $bmp
}

function Resize-Bitmap {
  param($Source, [int]$Width, [int]$Height)
  $bmp = New-Object System.Drawing.Bitmap($Width, $Height)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.DrawImage($Source, (New-Object System.Drawing.Rectangle(0, 0, $Width, $Height)))
  $g.Dispose()
  return $bmp
}

# 逐级减半缩放，避免一次性大幅缩小产生混叠
function New-ScaledBitmap {
  param($Source, [int]$Width, [int]$Height)
  $cur = $Source
  $cw = $cur.Width
  $ch = $cur.Height
  while (($cw -gt $Width * 2) -and ($ch -gt $Height * 2)) {
    $nw = [int][math]::Max($Width, $cw / 2)
    $nh = [int][math]::Max($Height, $ch / 2)
    $next = Resize-Bitmap -Source $cur -Width $nw -Height $nh
    if ($cur -ne $Source) { $cur.Dispose() }
    $cur = $next
    $cw = $nw
    $ch = $nh
  }
  if ($cw -ne $Width -or $ch -ne $Height) {
    $next = Resize-Bitmap -Source $cur -Width $Width -Height $Height
    if ($cur -ne $Source) { $cur.Dispose() }
    $cur = $next
  }
  return $cur
}

# 按源图矩形裁剪（不做缩放）
function New-CroppedBitmap {
  param($Source, [int]$X, [int]$Y, [int]$Width, [int]$Height)
  $bmp = New-Object System.Drawing.Bitmap($Width, $Height)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage(
    $Source,
    (New-Object System.Drawing.Rectangle(0, 0, $Width, $Height)),
    (New-Object System.Drawing.Rectangle($X, $Y, $Width, $Height)),
    [System.Drawing.GraphicsUnit]::Pixel
  )
  $g.Dispose()
  return $bmp
}

# 复制位图（用于派生变体，避免修改原图）
function Copy-Bitmap {
  param($Source)
  $bmp = New-Object System.Drawing.Bitmap($Source.Width, $Source.Height)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.DrawImage($Source, 0, 0, $Source.Width, $Source.Height)
  $g.Dispose()
  return $bmp
}

function Save-BrandPng {
  param($Bitmap, [string]$Path)
  $dir = Split-Path -Parent $Path
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
}
