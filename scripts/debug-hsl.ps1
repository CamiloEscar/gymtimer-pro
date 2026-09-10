Add-Type -AssemblyName System.Drawing

function HslToHex($h, $s, $l) {
    $hslColor = [System.Drawing.Color]::FromArgb(
        [int]([System.Drawing.Color]::FromArgb(255, 0, 0, 0).GetHue() * 0),
        [System.Drawing.KnownColor]::Black
    )
    # Use ColorConverter-style conversion via GetHue / GetSaturation / GetBrightness
    # is unreliable. Convert via HSLColor extension instead.
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

function HueToRgb($p, $q, $t) {
    if ($t -lt 0) { $t += 1 }
    if ($t -gt 1) { $t -= 1 }
    if ($t -lt 1/6) { return $p + ($q - $p) * 6 * $t }
    if ($t -lt 1/2) { return $q }
    if ($t -lt 2/3) { return $p + ($q - $p) * (2/3 - $t) * 6 }
    return $p
}

Write-Output "Hue 0: $(HslToHex 0 60 30)"
Write-Output "Hue 60: $(HslToHex 60 60 30)"
Write-Output "Hue 120: $(HslToHex 120 60 30)"
Write-Output "Hue 240: $(HslToHex 240 60 30)"
Write-Output "Hue 300: $(HslToHex 300 60 30)"