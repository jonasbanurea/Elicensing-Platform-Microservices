# Translation script for reports
# This script translates common Indonesian terms to natural English

$reportsFolder = "d:\KULIAH\TESIS\prototype_eng V2\reports"

# Define translation mappings (Indonesian to English)
$translations = @{
    "Laporan " = "Report: "
    " Laporan" = " Report"
    "Pengujian" = "Testing"
    "pengujian" = "testing"
    "Hasil " = "Results: "
    "hasil " = "results "
    "Tanggal" = "Date"
    "Durasi" = "Duration"
    "Konfigurasi" = "Configuration"
    "konfigurasi" = "configuration"
    "Kesimpulan" = "Conclusion"
    "kesimpulan" = "conclusion"
    "Rekomendasi" = "Recommendations"
    "rekomendasi" = "recommendations"
    "Analisis" = "Analysis"
    "analisis" = "analysis"
    "Metrik" = "Metric"
    "metrik" = "metrics"
    "Skenario" = "Scenario"
    "skenario" = "scenario"
    "Perbandingan" = "Comparison"
    "perbandingan" = "comparison"
    "Latensi" = "Latency"
    "latensi" = "latency"
    "Throughput" = "Throughput"
    "throughput" = "throughput"
    "Performa" = "Performance"
    "performa" = "performance"
    "Stabilitas" = "Stability"
    "stabilitas" = "stability"
    "Skalabilitas" = "Scalability"
    "skalabilitas" = "scalability"
    "Degradasi" = "Degradation"
    "degradasi" = "degradation"
    "Bottleneck" = "Bottleneck"
    "bottleneck" = "bottleneck"
    "Reliabilitas" = "Reliability"
    "reliabilitas" = "reliability"
    "Konsistensi" = "Consistency"
    "konsistensi" = "consistency"
    "Tujuan" = "Purpose"
    "tujuan" = "purpose"
    "Insight" = "Insights"
    "insight" = "insights"
    " dan " = " and "
    " atau " = " or "
    " dengan " = " with "
    " untuk " = " for "
    " pada " = " on "
    " di " = " in "
    " dari " = " from "
    " ke " = " to "
    "menunjukkan" = "shows"
    "memiliki" = "has"
    "lebih " = "more "
    " yang " = " that "
    "Semua" = "All"
    "semua" = "all"
    "Tidak ada" = "No"
    "tidak ada" = "no"
}

Write-Host "Starting translation of reports..." -ForegroundColor Cyan

Get-ChildItem -Path $reportsFolder -Filter "*.md" | ForEach-Object {
    $file = $_
    Write-Host "Processing: $($file.Name)" -ForegroundColor Yellow
    
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Apply translations
    foreach ($key in $translations.Keys) {
        $content = $content -replace [regex]::Escape($key), $translations[$key]
    }
    
    # Save the translated content
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8
    
    Write-Host "  ✓ Translated $($file.Name)" -ForegroundColor Green
}

Write-Host "`nTranslation complete!" -ForegroundColor Green
