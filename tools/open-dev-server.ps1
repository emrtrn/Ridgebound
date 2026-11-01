param(
  [switch]$Editor
)

$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$BaseUrl = "http://127.0.0.1:5175/"
$Url = if ($Editor) { "${BaseUrl}?editor" } else { $BaseUrl }

function Test-ServerReady {
  try {
    $Response = Invoke-WebRequest -Uri $BaseUrl -UseBasicParsing -TimeoutSec 1
    return $Response.StatusCode -eq 200
  } catch {
    return $false
  }
}

if (-not (Test-ServerReady)) {
  $LogDir = Join-Path $ProjectRoot ".forge/dev-server"
  New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
  $OutLog = Join-Path $LogDir "stdout.log"
  $ErrLog = Join-Path $LogDir "stderr.log"
  Start-Process -FilePath "npm.cmd" -ArgumentList @("run", "dev") `
    -WorkingDirectory $ProjectRoot -WindowStyle Hidden `
    -RedirectStandardOutput $OutLog -RedirectStandardError $ErrLog | Out-Null

  $Ready = $false
  for ($Attempt = 0; $Attempt -lt 40; $Attempt += 1) {
    Start-Sleep -Milliseconds 250
    if (Test-ServerReady) {
      $Ready = $true
      break
    }
  }
  if (-not $Ready) {
    Write-Error "Ridgebound dev server could not start. Logs: $OutLog and $ErrLog"
    exit 1
  }
}

Start-Process $Url
Write-Host "Opened $Url"
Write-Host "Game: $BaseUrl"
Write-Host "Editor: ${BaseUrl}?editor"
