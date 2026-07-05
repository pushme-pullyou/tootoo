# TooToo — assembler.
# Stitches src/index.template.html + components + css + js into a single index.html.
# No build tools: just text substitution.
#
#   <!-- @include components/x.html -->  -> the file's @part:...:start/end fragment
#   /* @include path */                  -> the whole file's contents
#
# Run (dev):   pwsh -File assemble.ps1
# Run (prod):  pwsh -File assemble.ps1 -Prod -OutFile ..\..\index.html
#
#   -Prod     : production build — swaps the dev config.js (which bakes a default repo
#               + 'TooToo Lab' identity for standalone testing) for the empty
#               config.prod.js, so the output stays byte-identical across forks. Each
#               fork customizes via its own tootoo.config.js (window.TOOTOO_CONFIG).
#   -OutFile  : output path (default: index.html beside this script).

param(
  [switch]$Prod,
  [string]$OutFile
)

$src = Join-Path $PSScriptRoot 'src'
$out = if ( $OutFile ) { $OutFile } else { Join-Path $PSScriptRoot 'index.html' }

$template = Get-Content (Join-Path $src 'index.template.html') -Raw

# Production: use the empty config.prod.js instead of the dev config.js.
if ( $Prod ) {
  $template = $template -replace '/\*\s*@include\s+config\.js\s*\*/', '/* @include config.prod.js */'
}

# 1. Component HTML includes -> extract the single @part fragment.
#    Looped so a fragment can itself @include another component (e.g. content embeds
#    the footer); stops when none remain (the cap guards against a typo'd loop).
$pass = 0
while ( ($template -match '<!--\s*@include\s+components/') -and ($pass -lt 8) ) {
  $template = [regex]::Replace($template, '<!--\s*@include\s+(components/[^\s]+\.html)\s*-->', {
    param($m)
    $rel = $m.Groups[1].Value
    $file = Join-Path $src $rel
    if (-not (Test-Path $file)) { "<!-- assemble: missing $rel -->" }
    else {
      $content = Get-Content $file -Raw
      $frag = [regex]::Match($content, '(?s)<!--\s*@part:[\w:]+:start\s*-->(.*?)<!--\s*@part:[\w:]+:end\s*-->')
      if ($frag.Success) { $frag.Groups[1].Value.Trim() }
      else { "<!-- assemble: no @part in $rel -->" }
    }
  })
  $pass++
}

# Loop bailed (cycle, or nesting deeper than the cap) → component includes survive
# into the output. They're invisible HTML comments, so warn loudly rather than ship
# a silently incomplete build.
if ( $template -match '<!--\s*@include\s+components/' ) {
  Write-Warning "assemble: unresolved component @include after $pass pass(es) — include cycle or nesting deeper than the cap. Output contains literal include comment(s)."
}

# 2. CSS / JS includes -> whole file contents.
$template = [regex]::Replace($template, '/\*\s*@include\s+([^\s\*]+)\s*\*/', {
  param($m)
  $file = Join-Path $src $m.Groups[1].Value
  if (Test-Path $file) { (Get-Content $file -Raw).TrimEnd() }
  else { "/* assemble: missing $($m.Groups[1].Value) */" }
})

Set-Content -Path $out -Value $template -Encoding UTF8
# Report the content length (Get-Item right after Set-Content can read a stale
# pre-flush cluster size, e.g. 4096, and look truncated when it isn't).
$mode = if ( $Prod ) { 'production' } else { 'dev' }
"assembled ($mode) -> $out  ({0:N0} chars)" -f $template.Length

# ── Favicon ──
# The app probes for a real favicon.ico beside index.html (detectRealFavicon) and the
# browser logs a noisy load failure every run when it's missing. So: if the dev folder
# has no favicon.ico, generate one — the same TT mark (blue rounded square, two white
# offset T's) drawn with System.Drawing and wrapped as a PNG-in-ICO. Runs only when
# the file is absent; delete favicon.ico to regenerate, or drop in your own.
$fav = Join-Path $PSScriptRoot 'favicon.ico'
if ( -not (Test-Path $fav) ) {
  Add-Type -AssemblyName System.Drawing
  $px = 64
  $bmp = New-Object System.Drawing.Bitmap $px, $px
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.TextRenderingHint = 'AntiAliasGridFit'
  $g.Clear([System.Drawing.Color]::Transparent)

  # Rounded square, #2563eb, corner radius 12/64 (mirrors the inline SVG favicon).
  $r = 12
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc(0, 0, 2 * $r, 2 * $r, 180, 90)
  $path.AddArc($px - 2 * $r, 0, 2 * $r, 2 * $r, 270, 90)
  $path.AddArc($px - 2 * $r, $px - 2 * $r, 2 * $r, 2 * $r, 0, 90)
  $path.AddArc(0, $px - 2 * $r, 2 * $r, 2 * $r, 90, 90)
  $path.CloseFigure()
  $blue = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(0x25, 0x63, 0xeb))
  $g.FillPath($blue, $path)

  # Two offset T's at the SVG's anchor points (22,28) and (42,40), centered.
  $font = New-Object System.Drawing.Font ('Segoe UI', 30, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $white = [System.Drawing.Brushes]::White
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = 'Center'
  $fmt.LineAlignment = 'Center'
  $g.DrawString('T', $font, $white, 22, 28, $fmt)
  $g.DrawString('T', $font, $white, 42, 40, $fmt)
  $g.Dispose()

  # ICO container with a single PNG entry (the modern format; browsers accept it).
  $ms = New-Object System.IO.MemoryStream
  $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  $png = $ms.ToArray()
  $ico = New-Object System.IO.MemoryStream
  $bw = New-Object System.IO.BinaryWriter $ico
  $bw.Write([uint16]0); $bw.Write([uint16]1); $bw.Write([uint16]1)   # reserved, type=icon, count=1
  $bw.Write([byte]$px); $bw.Write([byte]$px)                         # width, height
  $bw.Write([byte]0); $bw.Write([byte]0)                             # palette, reserved
  $bw.Write([uint16]1); $bw.Write([uint16]32)                        # planes, bpp
  $bw.Write([uint32]$png.Length); $bw.Write([uint32]22)              # data size, offset
  $bw.Write($png)
  [System.IO.File]::WriteAllBytes($fav, $ico.ToArray())
  $bw.Dispose()
  "created $fav  ({0:N0} bytes)" -f (Get-Item $fav).Length
}
