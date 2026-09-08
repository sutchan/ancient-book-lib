# scripts/brand/brand-social.ps1 v1.2.2
# 社交分享图（Open Graph / Twitter Card）生成：1200x630

Add-Type -AssemblyName System.Drawing

function Get-AvailableFont {
  param([string[]]$Candidates, [int]$Size, [int]$Style)
  $families = [System.Drawing.FontFamily]::Families | ForEach-Object { $_.Name }
  foreach ($c in $Candidates) {
    if ($families -contains $c) {
      return (New-Object System.Drawing.Font($c, $Size, [System.Drawing.FontStyle]$Style, [System.Drawing.GraphicsUnit]::Pixel))
    }
  }
  return (New-Object System.Drawing.Font([System.Drawing.FontFamily]::GenericSansSerif, $Size, [System.Drawing.FontStyle]$Style))
}

function New-BrandSocialImage {
  param(
    $MarkBitmap,
    [string]$Primary,
    [string]$OutPath,
    [string]$SiteUrl = 'guji.ewuse.com'
  )
  $w = 1200
  $h = 630
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $ink = [System.Drawing.ColorTranslator]::FromHtml($Primary)
  $muted = [System.Drawing.Color]::FromArgb(255, 108, 100, 88)
  $brushBg = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0, 0)),
    (New-Object System.Drawing.Point($w, $h)),
    [System.Drawing.Color]::FromArgb(255, 252, 250, 245),
    [System.Drawing.Color]::FromArgb(255, 237, 228, 212)
  )
  $g.FillRectangle($brushBg, 0, 0, $w, $h)
  $brushBg.Dispose()

  $markSize = 400
  $g.DrawImage($MarkBitmap, (New-Object System.Drawing.Rectangle(96, [int](($h - $markSize) / 2), $markSize, $markSize)))

  $brushInk = New-Object System.Drawing.SolidBrush($ink)
  $brushMuted = New-Object System.Drawing.SolidBrush($muted)
  $titleFont = Get-AvailableFont -Candidates @('Microsoft YaHei UI', 'Microsoft YaHei', 'SimHei') -Size 96 -Style 1
  $enFont = Get-AvailableFont -Candidates @('Segoe UI', 'Microsoft YaHei UI', 'Arial') -Size 44 -Style 0
  $subFont = Get-AvailableFont -Candidates @('Microsoft YaHei UI', 'Microsoft YaHei', 'SimHei') -Size 34 -Style 0
  $urlFont = Get-AvailableFont -Candidates @('Segoe UI', 'Microsoft YaHei UI', 'Arial') -Size 28 -Style 0

  $tx = 552
  $g.DrawString('古籍通', $titleFont, $brushInk, $tx, 150)
  $g.DrawString('AncientBook', $enFont, $brushMuted, ($tx + 4), 268)
  $g.FillRectangle($brushInk, $tx, 346, 520, 4)
  $g.DrawString('开源古籍文献检索阅读平台', $subFont, $brushInk, $tx, 386)
  $g.DrawString($SiteUrl, $urlFont, $brushMuted, $tx, 462)

  foreach ($f in @($titleFont, $enFont, $subFont, $urlFont)) { $f.Dispose() }
  $brushInk.Dispose()
  $brushMuted.Dispose()
  $g.Dispose()
  $dir = Split-Path -Parent $OutPath
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}
