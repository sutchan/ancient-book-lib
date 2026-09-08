# scripts/brand/build-brand-assets.ps1 v1.2.2
# 品牌资料生成：横版 logo / 方形徽章 / favicon / PWA 图标 / 社交分享图 / webmanifest
# 用法：powershell -NoProfile -ExecutionPolicy Bypass -File scripts/brand/build-brand-assets.ps1

param([string]$Source)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
. (Join-Path $PSScriptRoot 'brand-image.ps1')
. (Join-Path $PSScriptRoot 'brand-matte.ps1')
. (Join-Path $PSScriptRoot 'brand-ico.ps1')
. (Join-Path $PSScriptRoot 'brand-social.ps1')

$brandDir = Join-Path $root 'public/brand'
if (-not (Test-Path $brandDir)) { New-Item -ItemType Directory -Path $brandDir -Force | Out-Null }

$sourceJpg = Join-Path $brandDir 'logo-source.jpg'
if (-not $Source) {
  $Source = if (Test-Path $sourceJpg) { $sourceJpg } else { Join-Path $root 'public/images/logo.png' }
}
if (-not (Test-Path $sourceJpg)) { Copy-Item $Source $sourceJpg -Force }

$src = Get-BrandSourceBitmap -Path $Source
$layout = Measure-BrandLayout -Source $src
$primary = Get-BrandColor -Source $src -Mark $layout.Mark
Write-Output ("SOURCE  " + $src.Width + "x" + $src.Height + "  " + (Split-Path $Source -Leaf))
Write-Output ("BOX     x=" + $layout.Box.X + " y=" + $layout.Box.Y + " w=" + $layout.Box.W + " h=" + $layout.Box.H + " ratio=" + $layout.Ratio)
Write-Output ("MARK    x=" + $layout.Mark.X + " y=" + $layout.Mark.Y + " size=" + $layout.Mark.Size)
Write-Output ("PRIMARY " + $primary)

$fullSrc = New-CroppedBitmap -Source $src -X $layout.Box.X -Y $layout.Box.Y -Width $layout.Box.W -Height $layout.Box.H
$markSrc = New-CroppedBitmap -Source $src -X $layout.Mark.X -Y $layout.Mark.Y -Width $layout.Mark.Size -Height $layout.Mark.Size

# 印章区域（内缩 7%）保持不透明，避免印章内部白色线条被当作背景抠掉
$inset = [int][math]::Round($layout.Mark.Size * 0.07)
$markProtect = @{ X = $inset; Y = $inset; W = $layout.Mark.Size - 2 * $inset; H = $layout.Mark.Size - 2 * $inset }
$fullProtect = @{ X = $inset; Y = ($layout.Mark.Y - $layout.Box.Y) + $inset; W = $markProtect.W; H = $markProtect.H }
Remove-PaperBackground -Bitmap $fullSrc -Protect $fullProtect
Remove-PaperBackground -Bitmap $markSrc -Protect $markProtect

# 深色底反白变体：仅替换深色像素（文字），印章区域保持原色
$fullLight = Copy-Bitmap -Source $fullSrc
Convert-ToLightVariant -Bitmap $fullLight -Protect $fullProtect
$markLight = Copy-Bitmap -Source $markSrc
Convert-ToLightVariant -Bitmap $markLight -Protect $markProtect

function Export-BrandPng {
  param($SourceBitmap, [string]$Path, [int]$Width, [int]$Height)
  $target = New-ScaledBitmap -Source $SourceBitmap -Width $Width -Height $Height
  Save-BrandPng -Bitmap $target -Path $Path
  if ($target -ne $SourceBitmap) { $target.Dispose() }
}

foreach ($w in @(1024, 512, 256)) {
  $h = [int][math]::Round($w / $layout.Ratio)
  Export-BrandPng -SourceBitmap $fullSrc -Path (Join-Path $brandDir "logo-full-$w.png") -Width $w -Height $h
}
foreach ($s in @(512, 256, 192, 180, 96, 64, 48, 32, 16)) {
  Export-BrandPng -SourceBitmap $markSrc -Path (Join-Path $brandDir "logo-mark-$s.png") -Width $s -Height $s
}
foreach ($w in @(512, 256)) {
  $h = [int][math]::Round($w / $layout.Ratio)
  Export-BrandPng -SourceBitmap $fullLight -Path (Join-Path $brandDir "logo-full-light-$w.png") -Width $w -Height $h
}
foreach ($s in @(512, 192)) {
  Export-BrandPng -SourceBitmap $markLight -Path (Join-Path $brandDir "logo-mark-light-$s.png") -Width $s -Height $s
}

# 不透明底版本：iOS / Android maskable 需要实心背景
$paper = '#F7F3EA'
foreach ($item in @(@{ Path = 'logo-mark-solid-180.png'; Size = 180; Fill = 1.0 }, @{ Path = 'logo-mark-maskable-512.png'; Size = 512; Fill = 0.62 })) {
  $canvas = New-Object System.Drawing.Bitmap($item.Size, $item.Size)
  $g = [System.Drawing.Graphics]::FromImage($canvas)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.Clear([System.Drawing.ColorTranslator]::FromHtml($paper))
  $inner = [int][math]::Round($item.Size * $item.Fill)
  $off = [int][math]::Round(($item.Size - $inner) / 2)
  $g.DrawImage($markSrc, (New-Object System.Drawing.Rectangle($off, $off, $inner, $inner)))
  $g.Dispose()
  Save-BrandPng -Bitmap $canvas -Path (Join-Path $brandDir $item.Path)
  $canvas.Dispose()
}

# 社交分享图
$markForOg = New-ScaledBitmap -Source $markSrc -Width 512 -Height 512
New-BrandSocialImage -MarkBitmap $markForOg -Primary $primary -OutPath (Join-Path $brandDir 'og-image.png')
Copy-Item (Join-Path $brandDir 'og-image.png') (Join-Path $root 'app/opengraph-image.png') -Force
$markForOg.Dispose()

# favicon / 应用图标 / 兼容位
Write-BrandIco -Path (Join-Path $root 'public/favicon.ico') -PngPaths @(
  (Join-Path $brandDir 'logo-mark-16.png'),
  (Join-Path $brandDir 'logo-mark-32.png'),
  (Join-Path $brandDir 'logo-mark-48.png'),
  (Join-Path $brandDir 'logo-mark-64.png')
)
Copy-Item (Join-Path $brandDir 'logo-mark-solid-180.png') (Join-Path $root 'public/apple-touch-icon.png') -Force
Copy-Item (Join-Path $brandDir 'logo-mark-64.png') (Join-Path $root 'app/icon.png') -Force
Copy-Item (Join-Path $brandDir 'logo-mark-solid-180.png') (Join-Path $root 'app/apple-icon.png') -Force
Copy-Item (Join-Path $brandDir 'logo-full-512.png') (Join-Path $root 'public/images/logo.png') -Force

# PWA manifest
$manifest = @{
  name             = '古籍通 AncientBook'
  short_name       = '古籍通'
  description      = '开源公益古籍检索阅读与考据平台：殆知阁全量古籍在线、繁简保真阅读、毫秒级检索。'
  lang             = 'zh-CN'
  start_url        = './'
  scope            = './'
  display          = 'standalone'
  orientation      = 'any'
  background_color = $paper
  theme_color      = $primary
  categories       = @('books', 'education', 'reference')
  icons            = @(
    @{ src = './brand/logo-mark-192.png'; sizes = '192x192'; type = 'image/png'; purpose = 'any' },
    @{ src = './brand/logo-mark-512.png'; sizes = '512x512'; type = 'image/png'; purpose = 'any' },
    @{ src = './brand/logo-mark-maskable-512.png'; sizes = '512x512'; type = 'image/png'; purpose = 'maskable' }
  )
} | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText((Join-Path $root 'public/site.webmanifest'), $manifest, (New-Object System.Text.UTF8Encoding($false)))

# 品牌令牌（供文档与样式参考）
$tokens = @{
  brand   = '古籍通 AncientBook'
  primary = $primary
  paper   = $paper
  source  = 'public/brand/logo-source.jpg'
  ratio   = $layout.Ratio
  updated = (Get-Date).ToString('yyyy-MM-dd')
} | ConvertTo-Json
[System.IO.File]::WriteAllText((Join-Path $brandDir 'brand-tokens.json'), $tokens, (New-Object System.Text.UTF8Encoding($false)))

$fullSrc.Dispose()
$markSrc.Dispose()
$fullLight.Dispose()
$markLight.Dispose()
$src.Dispose()
Write-Output 'DONE    品牌资料已生成：public/brand、public/favicon.ico、app/icon.png、app/apple-icon.png、app/opengraph-image.png'
