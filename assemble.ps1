# assemble.ps1: build one self-contained build/index.html from src/index.html.
#
#   pwsh -File assemble.ps1              # release stamp 'dev'
#   pwsh -File assemble.ps1 -Release r2  # release stamp 'r2'
#
# It does three things and nothing else (SPEC.md §4 "The assembler"):
#   1. stamps <meta name="tootoo-release" content="…">
#   2. inlines each <script src="…"> that points into src/
#   3. inlines each <link rel="stylesheet" href="…"> that points into src/
# CDN tags (http:, https:, //) are left alone. The config block is never touched.

param( [string] $Release = 'dev' )

$ErrorActionPreference = 'Stop'

if ( $Release -notmatch '^(dev|r\d+)$' ) { throw "Release must be 'dev' or rN, e.g. r2 (got '$Release')" }

$src = Join-Path $PSScriptRoot 'src'
$buildFolder = Join-Path $PSScriptRoot 'build'
$html = [IO.File]::ReadAllText( ( Join-Path $src 'index.html' ) )

# 1. The release stamp: exactly one.
$stamp = '<meta name="tootoo-release" content="[^"]*">'
$count = ( [regex]::Matches( $html, $stamp ) ).Count
if ( $count -ne 1 ) { throw "src/index.html needs exactly one tootoo-release meta (found $count)" }
$html = $html -replace $stamp, "<meta name=`"tootoo-release`" content=`"$Release`">"

# Read one src/ file to inline, refusing text that would break the page or the swap.
$readSourceFile = {
  param( [string] $path, [string] $closingTag )
  $file = Join-Path $src $path
  if ( -not ( Test-Path $file ) ) { throw "src/index.html refers to a missing file: src/$path" }
  $text = [IO.File]::ReadAllText( $file )
  # A literal closing tag would end the inline block early.
  if ( $text -match "(?i)$closingTag" ) { throw "src/$path contains '$closingTag'. Split the string, e.g. '<' + '/script>'" }
  # A literal marker would give the release two markers and break the swap.
  if ( $text -match 'TOOTOO-CONFIG-(START|END)' ) { throw "src/$path contains a config marker. Build the string from parts, e.g. 'TOOTOO-CONFIG-' + 'START'" }
  return $text.TrimEnd()
}

$isLocal = { param( [string] $url ) $url -notmatch '^(https?:)?//' }

# Stylesheets before scripts: each pass scans only the text it was given, so a tag
# written inside an inlined script (e.g. a <link> that shell.js adds) is never touched.

# 2. Stylesheets.
$html = $html -replace '<link rel="stylesheet" href="([^"]+)">', {
  $path = $_.Groups[ 1 ].Value
  if ( -not ( & $isLocal $path ) ) { return $_.Value }
  "<style>/* src/$path */`n" + ( & $readSourceFile $path '</style' ) + "`n</style>"
}

# 3. Scripts.
$html = $html -replace '<script src="([^"]+)"></script>', {
  $path = $_.Groups[ 1 ].Value
  if ( -not ( & $isLocal $path ) ) { return $_.Value }
  "<script>/* src/$path */`n" + ( & $readSourceFile $path '</script' ) + "`n</script>"
}

New-Item -ItemType Directory -Force $buildFolder | Out-Null
$out = Join-Path $buildFolder 'index.html'
[IO.File]::WriteAllText( $out, $html, [Text.UTF8Encoding]::new( $false ) )

$lines = ( $html -split "`n" ).Count
Write-Host "assemble: wrote build/index.html ($lines lines, release $Release)"
