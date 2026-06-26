param([int]$Port = 5577)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$Port/"

# worker scriptblock: handle one request (range-aware, keep-alive off)
$worker = {
  param($ctx, $root)
  try {
    $mime = @{ ".html"="text/html; charset=utf-8"; ".css"="text/css; charset=utf-8"; ".js"="application/javascript; charset=utf-8"; ".svg"="image/svg+xml"; ".png"="image/png"; ".jpg"="image/jpeg"; ".jpeg"="image/jpeg"; ".webp"="image/webp"; ".mp4"="video/mp4"; ".json"="application/json" }
    $resp = $ctx.Response
    $resp.KeepAlive = $false
    $path = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ($path -eq "/") { $path = "/index.html" }
    $file = Join-Path $root ($path.TrimStart("/"))
    if (-not (Test-Path $file -PathType Leaf)) {
      $resp.StatusCode = 404
      $b = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
      $resp.OutputStream.Write($b, 0, $b.Length); $resp.OutputStream.Close(); return
    }
    $ext = [System.IO.Path]::GetExtension($file).ToLower()
    if ($mime.ContainsKey($ext)) { $resp.ContentType = $mime[$ext] }
    $resp.Headers["Accept-Ranges"] = "bytes"
    $resp.Headers["Cache-Control"] = "no-cache"
    $fs = [System.IO.File]::OpenRead($file)
    try {
      $total = $fs.Length
      $rangeHeader = $ctx.Request.Headers["Range"]
      $start = 0; $end = $total - 1
      if ($rangeHeader -and $rangeHeader -match "bytes=(\d*)-(\d*)") {
        if ($matches[1] -ne "") { $start = [int64]$matches[1] }
        if ($matches[2] -ne "") { $end = [int64]$matches[2] }
        $resp.StatusCode = 206
        $resp.Headers["Content-Range"] = "bytes $start-$end/$total"
      }
      $len = $end - $start + 1
      $resp.ContentLength64 = $len
      $fs.Seek($start, "Begin") | Out-Null
      $buf = New-Object byte[] 65536
      $remaining = $len
      while ($remaining -gt 0) {
        $toRead = [Math]::Min($buf.Length, $remaining)
        $read = $fs.Read($buf, 0, $toRead)
        if ($read -le 0) { break }
        $resp.OutputStream.Write($buf, 0, $read)
        $remaining -= $read
      }
    } finally { $fs.Close() }
    $resp.OutputStream.Close()
  } catch {}
}

$pool = [RunspaceFactory]::CreateRunspacePool(1, 12)
$pool.Open()

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $ps = [PowerShell]::Create()
    $ps.RunspacePool = $pool
    [void]$ps.AddScript($worker).AddArgument($ctx).AddArgument($root)
    [void]$ps.BeginInvoke()
  } catch {}
}
