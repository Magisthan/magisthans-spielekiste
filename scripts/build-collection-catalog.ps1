param(
    [string]$AmigaPath = "M:\Forum Datenbanken\Spieledatenbank_Amiga.ods",
    [string]$C64Path = "M:\Forum Datenbanken\Spieledatenbank_C64.ods",
    [string]$PcPath = "M:\Forum Datenbanken\Spieledatenbank_PC2.ods",
    [string]$OutputPath = "data\collection-catalog.js",
    [string]$ReportPath = "reports\collection-catalog-report.json"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression

function Get-OdsRows([string]$Path) {
    $stream = [System.IO.File]::Open(
        $Path,
        [System.IO.FileMode]::Open,
        [System.IO.FileAccess]::Read,
        [System.IO.FileShare]::ReadWrite
    )
    $archive = [System.IO.Compression.ZipArchive]::new(
        $stream,
        [System.IO.Compression.ZipArchiveMode]::Read,
        $false
    )

    try {
        $entry = $archive.GetEntry("content.xml")
        if (-not $entry) { throw "content.xml fehlt in $Path" }
        $reader = [System.IO.StreamReader]::new($entry.Open())
        try { [xml]$xml = $reader.ReadToEnd() } finally { $reader.Dispose() }

        $namespaces = [System.Xml.XmlNamespaceManager]::new($xml.NameTable)
        $namespaces.AddNamespace("table", "urn:oasis:names:tc:opendocument:xmlns:table:1.0")
        $namespaces.AddNamespace("text", "urn:oasis:names:tc:opendocument:xmlns:text:1.0")

        $table = $xml.SelectSingleNode("//table:table", $namespaces)
        if (-not $table) { throw "Kein Tabellenblatt in $Path gefunden" }

        $rows = [System.Collections.Generic.List[object]]::new()
        foreach ($row in $table.SelectNodes("./table:table-row", $namespaces)) {
            $values = [System.Collections.Generic.List[string]]::new()
            foreach ($cell in $row.SelectNodes("./table:table-cell|./table:covered-table-cell", $namespaces)) {
                $repeatText = $cell.GetAttribute(
                    "number-columns-repeated",
                    "urn:oasis:names:tc:opendocument:xmlns:table:1.0"
                )
                $repeat = if ($repeatText) { [int]$repeatText } else { 1 }
                $paragraphs = $cell.SelectNodes(".//text:p", $namespaces) |
                    ForEach-Object { $_.InnerText }
                $value = (($paragraphs -join " ").Trim())
                if ($repeat -gt 50 -and -not $value) { $repeat = 1 }
                for ($index = 0; $index -lt $repeat; $index++) { $values.Add($value) }
            }
            while ($values.Count -gt 0 -and [string]::IsNullOrWhiteSpace($values[$values.Count - 1])) {
                $values.RemoveAt($values.Count - 1)
            }
            if ($values.Count -gt 0) { $rows.Add(@($values)) }
        }
        return @($rows)
    }
    finally {
        $archive.Dispose()
        $stream.Dispose()
    }
}

function Convert-ToInteger($Value) {
    $number = 0
    if ([int]::TryParse(([string]$Value).Trim(), [ref]$number)) { return $number }
    return $null
}

$sources = @(
    @{ Key = "c64"; Path = $C64Path; Allowed = @("Commodore 64", "Commodore 16", "Apple II", "Atari", "Atari ST", "Atari XL", "Atari 8-bit", "ZX Spectrum") },
    @{ Key = "amiga"; Path = $AmigaPath; Allowed = @("Amiga", "Amiga CD32", "Amiga CDTV") },
    @{ Key = "pc"; Path = $PcPath; Allowed = @("PC", "MS-DOS", "PC/Mac") }
)

$catalog = [System.Collections.Generic.List[object]]::new()
$reportSources = [System.Collections.Generic.List[object]]::new()
$currentYear = (Get-Date).Year + 1

foreach ($source in $sources) {
    if (-not (Test-Path -LiteralPath $source.Path)) { throw "Quelldatei fehlt: $($source.Path)" }
    $rows = @(Get-OdsRows $source.Path)
    $emptyTitles = 0
    $invalidYears = [System.Collections.Generic.List[object]]::new()
    $unknownSystems = [System.Collections.Generic.List[object]]::new()
    $sourceEntries = [System.Collections.Generic.List[object]]::new()

    foreach ($row in ($rows | Select-Object -Skip 1)) {
        $title = if ($row.Count -gt 1) { ([string]$row[1]).Trim() } else { "" }
        if (-not $title) { $emptyTitles++; continue }

        $sourceId = Convert-ToInteger $(if ($row.Count -gt 0) { $row[0] } else { $null })
        $platform = if ($row.Count -gt 2) { ([string]$row[2]).Trim() } else { "" }
        $year = Convert-ToInteger $(if ($row.Count -gt 5) { $row[5] } else { $null })
        if ($null -eq $year -or $year -lt 1970 -or $year -gt $currentYear) {
            $invalidYears.Add(@{ id = $sourceId; title = $title; value = $(if ($row.Count -gt 5) { $row[5] } else { "" }) })
            $year = $null
        }
        if ($platform -and $platform -notin $source.Allowed) {
            $unknownSystems.Add(@{ id = $sourceId; title = $title; value = $platform })
        }

        $entry = [ordered]@{
            id = "$($source.Key)-$('{0:D4}' -f $(if ($sourceId) { $sourceId } else { $sourceEntries.Count + 1 }))"
            sourceId = $sourceId
            collection = $source.Key
            title = $title
            platform = $platform
            genre = $(if ($row.Count -gt 3) { ([string]$row[3]).Trim() } else { "" })
            publisher = $(if ($row.Count -gt 4) { ([string]$row[4]).Trim() } else { "" })
            year = $year
            medium = $(if ($row.Count -gt 6) { ([string]$row[6]).Trim() } else { "" })
            language = $(if ($row.Count -gt 7) { ([string]$row[7]).Trim() } else { "" })
            disks = Convert-ToInteger $(if ($row.Count -gt 8) { $row[8] } else { $null })
        }
        $sourceEntries.Add([pscustomobject]$entry)
        $catalog.Add([pscustomobject]$entry)
    }

    $duplicates = @($sourceEntries | Group-Object title | Where-Object Count -gt 1 | ForEach-Object {
        @{ title = $_.Name; count = $_.Count }
    })
    $reportSources.Add([pscustomobject][ordered]@{
        collection = $source.Key
        source = $source.Path
        entries = $sourceEntries.Count
        emptyTitleRowsSkipped = $emptyTitles
        invalidYears = @($invalidYears)
        unknownSystems = @($unknownSystems)
        duplicateTitlesPreserved = $duplicates
    })
}

$outputFullPath = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $OutputPath))
$reportFullPath = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $ReportPath))
[System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($outputFullPath)) | Out-Null
[System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($reportFullPath)) | Out-Null
$utf8 = [System.Text.UTF8Encoding]::new($false)
$catalogJson = $catalog | ConvertTo-Json -Depth 5 -Compress
$catalogScript = "window.COLLECTION_CATALOG = $catalogJson;`n"
[System.IO.File]::WriteAllText($outputFullPath, $catalogScript, $utf8)

$report = [ordered]@{
    generatedAt = (Get-Date).ToString("o")
    totalEntries = $catalog.Count
    sources = @($reportSources)
}
[System.IO.File]::WriteAllText(
    $reportFullPath,
    ($report | ConvertTo-Json -Depth 8),
    $utf8
)

Write-Host "Collection catalog: $($catalog.Count) entries"
foreach ($source in $reportSources) {
    Write-Host "  $($source.collection): $($source.entries)"
}
Write-Host "Output: $outputFullPath"
Write-Host "Report: $reportFullPath"
