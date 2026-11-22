# run-tests.ps1: assemble, run the suite in headless Chrome on src/ and on the build,
# then report line counts against the size budget (SPEC.md decision 23, §9).
#
#   pwsh -File run-tests.ps1
#
# Exits non-zero when any test fails or a run prints no "PASS n / FAIL n" line.

$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
if ( -not ( Test-Path $chrome ) ) { throw "Chrome not found at $chrome" }

& ( Join-Path $root 'assemble.ps1' )

$testsUrl = ( [Uri] ( Join-Path $root 'tests\index.html' ) ).AbsoluteUri
$failed = $false

Write-Host ''
foreach ( $run in @( @{ Name = 'src'; Query = '' }, @{ Name = 'release'; Query = '?release=1' } ) ) {
  $out = Join-Path $env:TEMP "tootoo-tests-$( $run.Name ).html"
  Remove-Item $out -ErrorAction SilentlyContinue
  # Chrome's own log noise goes to stderr, so it is kept out of the report.
  # A test that never settles keeps the page busy, so Chrome is stopped after 60 s of real time.
  $process = Start-Process $chrome -NoNewWindow -PassThru -RedirectStandardOutput $out -RedirectStandardError "$out.log" -ArgumentList `
    '--headless=new', '--disable-gpu', "--user-data-dir=`"$env:TEMP\tootoo-headless`"", '--window-size=1200,800', `
    '--allow-file-access-from-files', '--virtual-time-budget=10000', '--dump-dom', "$testsUrl$( $run.Query )"
  if ( -not $process.WaitForExit( 60000 ) ) { $process.Kill( $true ); Write-Host "$( $run.Name ): stopped after 60 s" }

  $result = Select-String -Path $out -Pattern 'PASS \d+ / FAIL \d+' | Select-Object -First 1
  if ( -not $result ) {
    # Tests are listed as they finish, so the last one shows where the run stalled.
    $last = [regex]::Matches( ( Get-Content $out -Raw ), '<li class="\w+">(.*?)</li>' ) | Select-Object -Last 1
    $after = if ( $last ) { "stalled after: $( $last.Groups[ 1 ].Value )" } else { 'no tests finished' }
    Write-Host ( '{0,-8} no PASS / FAIL line, {1} (see {2})' -f $run.Name, $after, $out )
    $failed = $true
    continue
  }
  $line = $result.Matches[ 0 ].Value
  Write-Host ( '{0,-8} {1}' -f $run.Name, $line )
  if ( $line -notmatch 'FAIL 0$' ) { $failed = $true }

  # Show the names of failing tests.
  $html = Get-Content $out -Raw
  foreach ( $match in [regex]::Matches( $html, '<li class="fail">(.*?)</li>' ) ) {
    Write-Host "         $( $match.Groups[ 1 ].Value )"
  }
}

# Line counts: per file at most about 300; JS + CSS in src/ at most about 2,500.
Write-Host ''
Write-Host 'Line counts (src/):'
$total = 0
$srcFolder = Join-Path $root 'src'
foreach ( $file in Get-ChildItem $srcFolder -Recurse -File | Sort-Object FullName ) {
  $lines = @( Get-Content $file.FullName ).Count
  $relative = [IO.Path]::GetRelativePath( $srcFolder, $file.FullName ) -replace '\\', '/'
  $flag = if ( $lines -gt 300 ) { '  over 300' } else { '' }
  Write-Host ( '  {0,5}  {1}{2}' -f $lines, $relative, $flag )
  if ( $file.Extension -in '.js', '.css' ) { $total += $lines }
}
$flag = if ( $total -gt 2500 ) { '  OVER BUDGET' } else { '' }
Write-Host ( '  JS + CSS total: {0} / 2500{1}' -f $total, $flag )

exit $( if ( $failed ) { 1 } else { 0 } )
