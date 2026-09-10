$catalogs = @(
    "src/lib/workout/exerciseCatalog.ts",
    "src/lib/workout/exerciseCatalogCrossfit.ts"
)

foreach ($catalog in $catalogs) {
    $content = Get-Content -LiteralPath $catalog -Raw

    # Insert `    videoUrl: "/exercises/{id}.mp4",` right after every `id: "..."` line.
    $updated = [regex]::Replace(
        $content,
        '^(    id:\s*"([^"]+)",\s*)$',
        "`$1`n    videoUrl: `"/exercises/`$2.mp4`",",
        [System.Text.RegularExpressions.RegexOptions]::Multiline
    )

    Set-Content -LiteralPath $catalog -Value $updated -NoNewline
    Write-Output "Updated $catalog"
}