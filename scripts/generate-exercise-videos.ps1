$catalogs = @(
    "src/lib/workout/exerciseCatalog.ts",
    "src/lib/workout/exerciseCatalogCrossfit.ts"
)

$ids = @()
foreach ($catalog in $catalogs) {
    $content = Get-Content -LiteralPath $catalog
    foreach ($line in $content) {
        # Strip ANSI escape codes (terminal coloring) before matching.
        $clean = $line -replace '\x1b\[[0-9;]*m', ''
        if ($clean -match 'id:\s*"([^"]+)"') {
            $ids += $Matches[1]
        }
    }
}

$ids = $ids | Select-Object -Unique
Write-Output "Found $($ids.Count) exercises"
Write-Output "First 5: $($ids[0..4] -join ', ')"
Write-Output "Last 5: $($ids[-5..-1] -join ', ')"

function HueToRgb($p, $q, $t) {
    if ($t -lt 0) { $t += 1 }
    if ($t -gt 1) { $t -= 1 }
    if ($t -lt 1/6) { return $p + ($q - $p) * 6 * $t }
    if ($t -lt 1/2) { return $q }
    if ($t -lt 2/3) { return $p + ($q - $p) * (2/3 - $t) * 6 }
    return $p
}

function HslToHex($h, $s, $l) {
    # Standard HSL→RGB conversion. Returns "#RRGGBB".
    $sat = $s / 100.0
    $light = $l / 100.0
    $hue = $h / 360.0

    if ($sat -eq 0) {
        $r = $g = $b = $light
    } else {
        $q = if ($light -lt 0.5) { $light * (1 + $sat) } else { $light + $sat - $light * $sat }
        $p = 2 * $light - $q
        $r = HueToRgb $p $q ($hue + 1/3)
        $g = HueToRgb $p $q $hue
        $b = HueToRgb $p $q ($hue - 1/3)
    }
    $r = [int]($r * 255); $g = [int]($g * 255); $b = [int]($b * 255)
    return ('#{0:X2}{1:X2}{2:X2}' -f $r, $g, $b)
}

foreach ($id in $ids) {
    $outPath = "public/exercises/$id.mp4"
    if (Test-Path -LiteralPath $outPath) { continue }

    # Hash ID → hue so each video has a distinct color
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($id)
    $hash = 0
    foreach ($b in $bytes) { $hash = ($hash * 31 + $b) -band 0xFFFFFF }
    $hue = [int](($hash % 360))
    $hex = HslToHex $hue 60 30

    # 5s color clip. Distinct per exercise. Loopable.
    $filter = "color=c=$hex`:s=640x360:d=5:r=24"

    $output = & "C:\ffmpeg\bin\ffmpeg.exe" -y -f lavfi -i $filter -c:v libx264 -pix_fmt yuv420p -movflags +faststart $outPath 2>&1

    if (Test-Path -LiteralPath $outPath) {
        $size = (Get-Item -LiteralPath $outPath).Length
        Write-Output "  $id ($hex, ${size}B)"
    } else {
        Write-Output "  FAILED: $id"
        Write-Output "  Last output: $($output[-3..-1] -join "`n")"
    }
}

Write-Output "Done."