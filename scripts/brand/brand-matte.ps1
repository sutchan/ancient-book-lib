# scripts/brand/brand-matte.ps1 v1.2.2
# 品牌图抠图与色彩处理：内容度量、主色采样、纸底转透明、深色底反白变体
# 依赖：Windows .NET System.Drawing（无需第三方依赖）

Add-Type -AssemblyName System.Drawing

function Read-PixelBytes {
  param($Bitmap)
  $rect = New-Object System.Drawing.Rectangle(0, 0, $Bitmap.Width, $Bitmap.Height)
  $data = $Bitmap.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $len = $data.Stride * $Bitmap.Height
  $bytes = New-Object byte[] $len
  [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $len)
  $Bitmap.UnlockBits($data)
  return @{ Bytes = $bytes; Stride = $data.Stride; Width = $Bitmap.Width; Height = $Bitmap.Height }
}

# 度量内容外接框与左侧印章方形区域（返回源图坐标系）
function Measure-BrandLayout {
  param($Source, [int]$Sample = 512, [int]$Threshold = 240)
  $thumb = Resize-Bitmap -Source $Source -Width $Sample -Height $Sample
  $px = Read-PixelBytes -Bitmap $thumb
  $bytes = $px.Bytes
  $stride = $px.Stride
  $cols = New-Object int[] $Sample
  $minX = $Sample; $maxX = -1; $minY = $Sample; $maxY = -1
  for ($y = 0; $y -lt $Sample; $y++) {
    $off = $stride * $y
    for ($x = 0; $x -lt $Sample; $x++) {
      $i = $off + $x * 3
      $lum = 0.299 * $bytes[$i + 2] + 0.587 * $bytes[$i + 1] + 0.114 * $bytes[$i]
      if ($lum -lt $Threshold) {
        $cols[$x]++
        if ($x -lt $minX) { $minX = $x }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }
  $thumb.Dispose()
  $scale = $Source.Width / $Sample
  # 印章与右侧文字之间的空白列（连续 3 列全空）作为分界
  $gap = -1
  for ($x = $minX + 1; $x -lt $maxX; $x++) {
    if ($cols[$x] -eq 0 -and $cols[$x + 1] -eq 0 -and $cols[$x + 2] -eq 0) { $gap = $x; break }
  }
  $markW = if ($gap -gt 0) { $gap - $minX } else { $maxY - $minY + 1 }
  $markY = [int][math]::Round((($minY + $maxY) / 2) - $markW / 2)
  return @{
    Box   = @{ X = [int]($minX * $scale); Y = [int]($minY * $scale); W = [int](($maxX - $minX + 1) * $scale); H = [int](($maxY - $minY + 1) * $scale) }
    Mark  = @{ X = [int]($minX * $scale); Y = [int]($markY * $scale); Size = [int]($markW * $scale) }
    Ratio = [math]::Round(($maxX - $minX + 1) / ($maxY - $minY + 1), 3)
  }
}

# 采样印章环形区域平均色（品牌主色）
function Get-BrandColor {
  param($Source, $Mark)
  $r = $Mark.Size / 2
  $cx = $Mark.X + $r
  $cy = $Mark.Y + $r
  $sumR = 0; $sumG = 0; $sumB = 0; $n = 0
  foreach ($rr in @(0.40, 0.44, 0.47)) {
    for ($a = 0; $a -lt 360; $a += 6) {
      $rad = $a * [math]::PI / 180
      $x = [int][math]::Round($cx + $r * $rr * [math]::Cos($rad))
      $y = [int][math]::Round($cy + $r * $rr * [math]::Sin($rad))
      if ($x -lt 0 -or $y -lt 0 -or $x -ge $Source.Width -or $y -ge $Source.Height) { continue }
      $p = $Source.GetPixel($x, $y)
      if ((0.299 * $p.R + 0.587 * $p.G + 0.114 * $p.B) -gt 200) { continue }
      $sumR += $p.R; $sumG += $p.G; $sumB += $p.B; $n++
    }
  }
  if ($n -eq 0) { return '#A93320' }
  return ('#{0:X2}{1:X2}{2:X2}' -f [int]($sumR / $n), [int]($sumG / $n), [int]($sumB / $n))
}

# 纸底转透明：>= $Clear 全透明，$Solid~$Clear 渐变并对白底做反预乘
# $Protect 为保护矩形（像素 @{X;Y;W;H}）：区域内保持不透明，用于保留印章内部白色线条
function Remove-PaperBackground {
  param($Bitmap, $Protect, [double]$Solid = 232, [double]$Clear = 242)
  $rect = New-Object System.Drawing.Rectangle(0, 0, $Bitmap.Width, $Bitmap.Height)
  $data = $Bitmap.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $stride = $data.Stride
  $len = $stride * $Bitmap.Height
  $bytes = New-Object byte[] $len
  [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $len)
  $px0 = -1; $px1 = -1; $py0 = -1; $py1 = -1
  if ($Protect) {
    $px0 = [int]$Protect.X; $py0 = [int]$Protect.Y
    $px1 = $px0 + [int]$Protect.W; $py1 = $py0 + [int]$Protect.H
  }
  $range = $Clear - $Solid
  for ($y = 0; $y -lt $Bitmap.Height; $y++) {
    $row = $y * $stride
    $inProtectY = ($y -ge $py0) -and ($y -lt $py1)
    for ($x = 0; $x -lt $Bitmap.Width; $x++) {
      $i = $row + $x * 4
      if ($inProtectY -and ($x -ge $px0) -and ($x -lt $px1)) { $bytes[$i + 3] = 255; continue }
      $b = $bytes[$i]; $g = $bytes[$i + 1]; $r = $bytes[$i + 2]
      $lum = 0.299 * $r + 0.587 * $g + 0.114 * $b
      if ($lum -ge $Clear) { $bytes[$i + 3] = 0; continue }
      if ($lum -le $Solid) { $bytes[$i + 3] = 255; continue }
      $alpha = 255 * ($Clear - $lum) / $range
      if ($alpha -lt 4) { $bytes[$i + 3] = 0; continue }
      $a = $alpha / 255
      $bytes[$i] = [byte][math]::Min(255, [math]::Max(0, [math]::Round(255 - (255 - $b) / $a)))
      $bytes[$i + 1] = [byte][math]::Min(255, [math]::Max(0, [math]::Round(255 - (255 - $g) / $a)))
      $bytes[$i + 2] = [byte][math]::Min(255, [math]::Max(0, [math]::Round(255 - (255 - $r) / $a)))
      $bytes[$i + 3] = [byte][math]::Round($alpha)
    }
  }
  [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $len)
  $Bitmap.UnlockBits($data)
}

# 深色像素替换为浅色（用于深色背景下的反白 logo，$Protect 区域内保持不变）
function Convert-ToLightVariant {
  param($Bitmap, $Protect, [string]$Color = '#F5F0E3', [double]$MaxLum = 150)
  $c = [System.Drawing.ColorTranslator]::FromHtml($Color)
  $rect = New-Object System.Drawing.Rectangle(0, 0, $Bitmap.Width, $Bitmap.Height)
  $data = $Bitmap.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $stride = $data.Stride
  $len = $stride * $Bitmap.Height
  $bytes = New-Object byte[] $len
  [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $len)
  $px0 = -1; $px1 = -1; $py0 = -1; $py1 = -1
  if ($Protect) {
    $px0 = [int]$Protect.X; $py0 = [int]$Protect.Y
    $px1 = $px0 + [int]$Protect.W; $py1 = $py0 + [int]$Protect.H
  }
  for ($y = 0; $y -lt $Bitmap.Height; $y++) {
    $row = $y * $stride
    $inProtectY = ($y -ge $py0) -and ($y -lt $py1)
    for ($x = 0; $x -lt $Bitmap.Width; $x++) {
      $i = $row + $x * 4
      if ($bytes[$i + 3] -eq 0) { continue }
      if ($inProtectY -and ($x -ge $px0) -and ($x -lt $px1)) { continue }
      $b = $bytes[$i]; $g = $bytes[$i + 1]; $r = $bytes[$i + 2]
      if ((0.299 * $r + 0.587 * $g + 0.114 * $b) -lt $MaxLum) {
        $bytes[$i] = $c.B; $bytes[$i + 1] = $c.G; $bytes[$i + 2] = $c.R
      }
    }
  }
  [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $len)
  $Bitmap.UnlockBits($data)
}
