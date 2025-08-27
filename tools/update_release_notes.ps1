param(
  [string]$RepoPath = (Resolve-Path (Join-Path $PSScriptRoot "..")),
  [string]$NotesPath = (Resolve-Path (Join-Path $PSScriptRoot "..\RELEASE_NOTES.md")),
  [switch]$IncludeNoChangeDays = $false,
  [switch]$ForceRegen = $false,
  [int]$LookbackDaysIfEmpty = 7
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Lightweight logging
function Write-Log {
  param([string]$Message)
  try{
    $stamp = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
    $logPath = Join-Path $PSScriptRoot 'update_release_notes.log'
    Add-Content -Path $logPath -Value ("[$stamp] " + $Message)
  }catch{}
}

function Get-ExistingNoteDates {
  param([string]$Path)
  if(!(Test-Path $Path)){ return @() }
  $dates = @()
  Get-Content -Path $Path | ForEach-Object {
    if($_ -match '^##\s+(\d{4}-\d{2}-\d{2})\s*$'){
      $dates += [datetime]::ParseExact($Matches[1],'yyyy-MM-dd',$null)
    }
  }
  return $dates | Sort-Object
}

function Get-CommitSummariesByDate {
  param(
    [string]$Repo,
    [datetime]$FromDate,
    [datetime]$ToDate
  )
  # Returns: @{ 'yyyy-MM-dd' = @(@{Subject=''; Author=''; Hash=''; Files=@('a','b')}, ...) }
  $result = @{}
  $since = $FromDate.ToString('yyyy-MM-ddT00:00:00')
  $until = $ToDate.ToString('yyyy-MM-ddT23:59:59')
  $format = "%ad%x09%h%x09%an%x09%s"
  $env:GIT_PAGER = 'cat'
  $log = & git -C $Repo log --since=$since --until=$until --date=short --pretty=format:$format --name-only 2>$null
  if([string]::IsNullOrWhiteSpace($log)){ return $result }
  $current = $null
  foreach($line in ($log -split "`n")){
    if([string]::IsNullOrWhiteSpace($line)) { continue }
    if($line -match '^(\d{4}-\d{2}-\d{2})\t([0-9a-fA-F]+)\t(.+?)\t(.*)$'){
      $date = $Matches[1]
      $hash = $Matches[2]
      $author = $Matches[3]
      $subject = $Matches[4]
      $current = [pscustomobject]@{ Date=$date; Hash=$hash; Author=$author; Subject=$subject; Files=@() }
      if(-not $result.ContainsKey($date)){ $result[$date] = New-Object System.Collections.ArrayList }
      [void]$result[$date].Add($current)
    } else {
      # treat as file line (path)
      if($null -ne $current){ $current.Files += $line.Trim() }
    }
  }
  return $result
}

function Build-SectionMarkdown {
  param([string]$Date,[object[]]$Commits,[switch]$IncludeNoChangeDays)
  $nl = "`r`n"
  $sb = New-Object System.Text.StringBuilder
  [void]$sb.Append("## $Date$nl$nl")
  if(($Commits | Measure-Object).Count -gt 0){
    # Group by top-level area (Daftar_Kol/js, css, index.html) to make it readable
    $items = @()
    foreach($c in $Commits){
      $files = $c.Files | Where-Object { $_ -ne '' } | Select-Object -Unique
      $area = if(($files | Where-Object { $_ -match '^Daftar_Kol/js' }).Count -gt 0){ 'Code' }
              elseif(($files | Where-Object { $_ -match '^Daftar_Kol/css' }).Count -gt 0){ 'Styles' }
              elseif(($files | Where-Object { $_ -match 'index\.html$' }).Count -gt 0){ 'HTML' }
              else { 'Misc' }
      $items += [pscustomobject]@{ Area=$area; Commit=$c }
    }
    $ordered = $items | Sort-Object Area
    [void]$sb.Append("- __Commits__${nl}")
    foreach($it in $ordered){
      $c = $it.Commit
      $shortFiles = if($c.Files.Count -gt 0){
        ($c.Files | ForEach-Object { $_.Replace('c:/Users/','').Replace('C:/Users/','') } | Select-Object -Unique) -join ', '
      } else { '' }
      $line = "  - ${c.Subject} (`${c.Hash}`, by ${c.Author})"
      if($shortFiles){ $line += " — ${shortFiles}" }
      [void]$sb.Append($line + $nl)
    }
  } else {
    if($IncludeNoChangeDays){
      [void]$sb.Append("- در این روز تغییر کدی ثبت نشده است.${nl}")
    }
  }
  [void]$sb.Append($nl)
  return $sb.ToString()
}

# Main
if(!(Test-Path $RepoPath)){ throw "RepoPath not found: $RepoPath" }
if(!(Test-Path $NotesPath)){ New-Item -ItemType File -Path $NotesPath -Force | Out-Null }

$existingDates = Get-ExistingNoteDates -Path $NotesPath
$today = (Get-Date).Date

$fromDate = if($existingDates.Count -gt 0){ ($existingDates[-1]).AddDays(1) } else { $today.AddDays(-$LookbackDaysIfEmpty) }
if($ForceRegen){ $fromDate = $today.AddDays(-$LookbackDaysIfEmpty) }

Write-Log ("Start update. RepoPath={0} NotesPath={1}" -f $RepoPath, $NotesPath)
Write-Log ("Computed range: from={0} to={1} ForceRegen={2} IncludeNoChangeDays={3}" -f $fromDate.ToString('yyyy-MM-dd'), $today.ToString('yyyy-MM-dd'), $ForceRegen, $IncludeNoChangeDays)

if($fromDate -gt $today){ Write-Host "No days to add."; Write-Log "No days to add (fromDate > today)."; exit 0 }

$byDate = Get-CommitSummariesByDate -Repo $RepoPath -FromDate $fromDate -ToDate $today

# Build new sections for dates not present (or all when ForceRegen)
$newSections = @()
$cursor = $fromDate
while($cursor -le $today){
  $dstr = $cursor.ToString('yyyy-MM-dd')
  if($ForceRegen -or -not ($existingDates | ForEach-Object { $_.ToString('yyyy-MM-dd') } | Where-Object { $_ -eq $dstr })){
    $commits = if($byDate.ContainsKey($dstr)){ $byDate[$dstr] } else { @() }
    $md = Build-SectionMarkdown -Date $dstr -Commits $commits -IncludeNoChangeDays:$IncludeNoChangeDays
    if($md.Trim().Length -gt 0){ $newSections += $md }
  }
  $cursor = $cursor.AddDays(1)
}

if($newSections.Count -eq 0){ Write-Host "Nothing to prepend."; Write-Log "Nothing to prepend (no new sections)."; exit 0 }

# Prepend to notes (keeping header lines at the top)
$notes = Get-Content -Raw -Path $NotesPath
# Detect the first section start after header (line starting with ## YYYY-MM-DD)
$headerEndIdx = 0
$lines = $notes -split "`r?`n"
for($i=0; $i -lt $lines.Length; $i++){
  if($lines[$i] -match '^##\s+\d{4}-\d{2}-\d{2}') { $headerEndIdx = $i; break }
}
if($headerEndIdx -eq 0){ $headerText = $notes }
else { $headerText = ($lines[0..($headerEndIdx-1)] -join "`r`n") + "`r`n" }

$prepend = ($newSections -join "")
$backup = "$NotesPath.bak"
Copy-Item -Path $NotesPath -Destination $backup -Force

Set-Content -Path $NotesPath -Value ($headerText + $prepend + ($notes.Substring($headerText.Length))) -Encoding UTF8
Write-Host "Release notes updated. Backup: $backup"
Write-Log ("Updated release notes. Backup at: {0}" -f $backup)
