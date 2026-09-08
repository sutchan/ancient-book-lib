# scripts/brand/brand-ico.ps1 v1.2.2
# ICO 封装：将多张 PNG 打包为单个多尺寸 favicon.ico（PNG 内嵌，现代浏览器通用）

function Get-PngSize {
  param([byte[]]$Bytes)
  if ($Bytes.Length -lt 24) { return 0 }
  return [System.BitConverter]::ToUInt32(($Bytes[19..16]), 0)
}

function Write-BrandIco {
  param([string]$Path, [string[]]$PngPaths)
  $items = @()
  foreach ($p in $PngPaths) {
    $bytes = [System.IO.File]::ReadAllBytes($p)
    $items += @{ Bytes = $bytes; Size = (Get-PngSize -Bytes $bytes) }
  }
  $ms = New-Object System.IO.MemoryStream
  $bw = New-Object System.IO.BinaryWriter($ms)
  $bw.Write([uint16]0)
  $bw.Write([uint16]1)
  $bw.Write([uint16]$items.Count)
  $offset = 6 + 16 * $items.Count
  foreach ($it in $items) {
    $dim = if ($it.Size -ge 256) { 0 } else { [byte]$it.Size }
    $bw.Write([byte]$dim)
    $bw.Write([byte]$dim)
    $bw.Write([byte]0)
    $bw.Write([byte]0)
    $bw.Write([uint16]1)
    $bw.Write([uint16]32)
    $bw.Write([uint32]$it.Bytes.Length)
    $bw.Write([uint32]$offset)
    $offset += $it.Bytes.Length
  }
  foreach ($it in $items) { $bw.Write($it.Bytes) }
  $bw.Flush()
  $dir = Split-Path -Parent $Path
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  [System.IO.File]::WriteAllBytes($Path, $ms.ToArray())
  $bw.Dispose()
  $ms.Dispose()
  return $Path
}
