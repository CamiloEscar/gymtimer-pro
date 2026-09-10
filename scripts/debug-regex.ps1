$line = '    id: "cf-wl-01",'
$clean = $line -replace '\x1b\[[0-9;]*m', ''
Write-Output "Clean: '$clean'"
if ($clean -match 'id:\s*"([^"]+)"') {
    Write-Output "Matched: $($Matches[1])"
} else {
    Write-Output "No match"
}