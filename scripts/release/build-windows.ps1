param(
  [Parameter(Mandatory = $true)]
  [string]$Tag,
  [switch]$SkipInstall
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $root

function Assert-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $Name"
  }
}

function Invoke-Checked([string]$Command, [string[]]$Arguments) {
  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Command failed with exit code $LASTEXITCODE"
  }
}

Assert-Command 'git'
Assert-Command 'node'
Assert-Command 'npm.cmd'

$head = (git rev-parse HEAD).Trim()
$tagCommit = (git rev-list -n 1 $Tag 2>$null).Trim()
if (-not $tagCommit) {
  throw "Tag '$Tag' does not exist locally. Fetch tags before building."
}
if ($head -ne $tagCommit) {
  throw "HEAD ($head) is not the commit referenced by $Tag ($tagCommit)."
}
if (git status --porcelain) {
  throw 'The worktree is dirty. Commit or stash changes before producing a release.'
}

if (-not $env:HTTPS_PROXY) {
  $env:HTTPS_PROXY = 'http://127.0.0.1:7897'
}
if (-not $env:HTTP_PROXY) {
  $env:HTTP_PROXY = $env:HTTPS_PROXY
}

if (-not $SkipInstall) {
  Invoke-Checked 'npm.cmd' @('ci')
}

$outputDir = Join-Path $root "release-artifacts\$Tag\windows"
Remove-Item -LiteralPath $outputDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

$env:TODO_MATRIX_USE_SQUIRREL = '1'
Invoke-Checked 'npm.cmd' @('run', 'desktop:make:proxy')

$setup = Get-ChildItem (Join-Path $root 'out\make') -Recurse -File -Filter 'TodoMatrixSetup.exe' |
  Select-Object -First 1
$portable = Get-ChildItem (Join-Path $root 'out\make') -Recurse -File -Filter '*.zip' |
  Where-Object { $_.FullName -match 'zip' } |
  Select-Object -First 1

if (-not $setup) {
  throw 'TodoMatrixSetup.exe was not generated.'
}
if (-not $portable) {
  throw 'The Windows portable ZIP was not generated.'
}

$setupTarget = Join-Path $outputDir "todo-matrix-$Tag-windows-setup.exe"
$portableTarget = Join-Path $outputDir "todo-matrix-$Tag-windows-portable.zip"
Copy-Item -LiteralPath $setup.FullName -Destination $setupTarget
Copy-Item -LiteralPath $portable.FullName -Destination $portableTarget

$checksumPath = Join-Path $outputDir 'SHA256SUMS-windows.txt'
Get-ChildItem $outputDir -File |
  Where-Object { $_.Name -ne 'SHA256SUMS-windows.txt' } |
  ForEach-Object {
    $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant()
    "$hash  $($_.Name)"
  } |
  Set-Content -Encoding ascii $checksumPath

Write-Host "Windows release artifacts are ready: $outputDir"
