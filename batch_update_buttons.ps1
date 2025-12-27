# PowerShell script to batch update all JSX files with dynamic button colors
# This script will systematically replace hardcoded button colors with dynamic CSS variables

$baseDir = "c:\Users\Harinie\OneDrive\Desktop\Nutryah HRM\hr\src\pages"
$updatedCount = 0
$totalCount = 0

# Define replacement patterns
$patterns = @(
    @{
        Find = 'className="([^"]*?)bg-blue-600([^"]*?)"'
        Replace = 'style={{ backgroundColor: ''var(--primary-color, #2862e9)'' }} className="$1text-white$2" onMouseEnter={(e) => e.target.style.backgroundColor = ''var(--primary-hover, #1e4bb8)''} onMouseLeave={(e) => e.target.style.backgroundColor = ''var(--primary-color, #2862e9)''}"'
    },
    @{
        Find = 'className="([^"]*?)bg-blue-700([^"]*?)"'
        Replace = 'style={{ backgroundColor: ''var(--primary-color, #2862e9)'' }} className="$1text-white$2" onMouseEnter={(e) => e.target.style.backgroundColor = ''var(--primary-hover, #1e4bb8)''} onMouseLeave={(e) => e.target.style.backgroundColor = ''var(--primary-color, #2862e9)''}"'
    },
    @{
        Find = 'className="([^"]*?)hover:bg-blue-700([^"]*?)"'
        Replace = 'className="$1$2"'
    },
    @{
        Find = 'className="([^"]*?)hover:bg-blue-600([^"]*?)"'
        Replace = 'className="$1$2"'
    },
    @{
        Find = 'className="([^"]*?)bg-gradient-to-r from-blue-600 to-indigo-600([^"]*?)"'
        Replace = 'style={{ backgroundColor: ''var(--primary-color, #2862e9)'' }} className="$1text-white$2" onMouseEnter={(e) => e.target.style.backgroundColor = ''var(--primary-hover, #1e4bb8)''} onMouseLeave={(e) => e.target.style.backgroundColor = ''var(--primary-color, #2862e9)''}"'
    },
    @{
        Find = 'className="([^"]*?)hover:from-blue-700 hover:to-indigo-700([^"]*?)"'
        Replace = 'className="$1$2"'
    },
    @{
        Find = 'className="([^"]*?)bg-gray-600([^"]*?)"'
        Replace = 'style={{ backgroundColor: ''var(--primary-color, #2862e9)'' }} className="$1text-white$2" onMouseEnter={(e) => e.target.style.backgroundColor = ''var(--primary-hover, #1e4bb8)''} onMouseLeave={(e) => e.target.style.backgroundColor = ''var(--primary-color, #2862e9)''}"'
    },
    @{
        Find = 'className="([^"]*?)bg-gray-700([^"]*?)"'
        Replace = 'style={{ backgroundColor: ''var(--primary-color, #2862e9)'' }} className="$1text-white$2" onMouseEnter={(e) => e.target.style.backgroundColor = ''var(--primary-hover, #1e4bb8)''} onMouseLeave={(e) => e.target.style.backgroundColor = ''var(--primary-color, #2862e9)''}"'
    },
    @{
        Find = 'className="([^"]*?)hover:bg-gray-700([^"]*?)"'
        Replace = 'className="$1$2"'
    },
    @{
        Find = 'className="([^"]*?)hover:bg-gray-600([^"]*?)"'
        Replace = 'className="$1$2"'
    }
)

# Get all JSX files recursively
$jsxFiles = Get-ChildItem -Path $baseDir -Recurse -Filter "*.jsx" | Where-Object { 
    $_.Name -notmatch "Dashboard\.jsx|LeaveApplications\.jsx|Recruitment\.jsx|Login\.jsx|HospitalRegister\.jsx" 
}

Write-Host "🚀 Starting batch update of button colors..." -ForegroundColor Green
Write-Host "Found $($jsxFiles.Count) JSX files to process" -ForegroundColor Yellow

foreach ($file in $jsxFiles) {
    $totalCount++
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $fileUpdated = $false
    
    foreach ($pattern in $patterns) {
        if ($content -match $pattern.Find) {
            $content = $content -replace $pattern.Find, $pattern.Replace
            $fileUpdated = $true
        }
    }
    
    if ($fileUpdated) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        $updatedCount++
        Write-Host "✅ Updated: $($file.Name)" -ForegroundColor Green
    } else {
        Write-Host "⏭️  No changes: $($file.Name)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "📊 Batch Update Summary:" -ForegroundColor Cyan
Write-Host "   Total files processed: $totalCount" -ForegroundColor White
Write-Host "   Files updated: $updatedCount" -ForegroundColor Green
Write-Host "   Files unchanged: $($totalCount - $updatedCount)" -ForegroundColor Gray
Write-Host ""
Write-Host "✨ Batch update completed successfully!" -ForegroundColor Green
Write-Host "🎯 All buttons now use dynamic colors from CSS variables:" -ForegroundColor Yellow
Write-Host "   - Primary buttons: CSS var primary-color" -ForegroundColor White
Write-Host "   - Hover state: CSS var primary-hover" -ForegroundColor White
Write-Host "   - Colors can be changed globally via Customization page" -ForegroundColor White