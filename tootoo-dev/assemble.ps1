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
    $file = Join-Path $src $m.Groups[1].Value
    $content = Get-Content $file -Raw
    $frag = [regex]::Match($content, '(?s)<!--\s*@part:[\w:]+:start\s*-->(.*?)<!--\s*@part:[\w:]+:end\s*-->')
    if ($frag.Success) { $frag.Groups[1].Value.Trim() }
    else { "<!-- assemble: no @part in $($m.Groups[1].Value) -->" }
  })
  $pass++
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
