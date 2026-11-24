# assemble.ps1: build one self-contained build/index.html from src/index.html.
#
#   pwsh -File assemble.ps1              # release stamp 'dev'
#   pwsh -File assemble.ps1 -Release r2  # release stamp 'r2'
#
# It does three things to the build (SPEC.md §4 "The assembler"):
#   1. stamps <meta name="tootoo-release" content="…"> and <meta name="tootoo-built" content="YYYY-MM-DD">,
#      and adds a one-line banner comment under the doctype
#   2. inlines each <script src="…"> that points into src/
#   3. inlines each <link rel="stylesheet" href="…"> that points into src/
# CDN tags (http:, https:, //) are left alone. The config block is never touched.
#
# Then, for a dev build only, it refreshes this repo's own root index.html: the new build with the
# root's config block carried over unchanged, so the workshop's front page always runs the latest build.

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

# The build date (date only, so a rebuild on the same day changes nothing), and a banner for whoever opens the file.
$built = Get-Date -Format 'yyyy-MM-dd'
$builtStamp = '<meta name="tootoo-built" content="[^"]*">'
if ( ( [regex]::Matches( $html, $builtStamp ) ).Count -ne 1 ) { throw 'src/index.html needs exactly one tootoo-built meta' }
$html = $html -replace $builtStamp, "<meta name=`"tootoo-built`" content=`"$built`">"
$doctype = '<!doctype html>'
if ( -not $html.StartsWith( $doctype ) ) { throw "src/index.html must start with $doctype" }
$banner = "<!-- TooToo $Release, built $built. Generated from https://github.com/pushme-pullyou/tootoo. Edit only the settings block below: updates replace everything else. -->"
$html = $doctype + "`n" + $banner + $html.Substring( $doctype.Length )

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

# 4. Dev builds only: the root index.html = this build + the root's own config block (the same swap as an update).
$root = Join-Path $PSScriptRoot 'index.html'
if ( $Release -eq 'dev' -and ( Test-Path $root ) ) {
  $start = '<!-- TOOTOO-CONFIG-START'
  $end = '<!-- TOOTOO-CONFIG-END -->'
  $blockOf = {
    param( [string] $text, [string] $name )
    $a = $text.IndexOf( $start ); $b = $text.IndexOf( $end )
    if ( $a -lt 0 -or $b -lt $a -or $text.IndexOf( $start, $a + 1 ) -ge 0 ) { throw "$name needs each config marker exactly once" }
    return @{ from = $a; to = $b + $end.Length }
  }
  $own = [IO.File]::ReadAllText( $root )
  $ownBlock = & $blockOf $own 'index.html (root)'
  $newBlock = & $blockOf $html 'the build'
  $merged = $html.Substring( 0, $newBlock.from ) + $own.Substring( $ownBlock.from, $ownBlock.to - $ownBlock.from ) + $html.Substring( $newBlock.to )
  [IO.File]::WriteAllText( $root, $merged, [Text.UTF8Encoding]::new( $false ) )
  Write-Host 'assemble: refreshed index.html (root) with its own config block'
}
