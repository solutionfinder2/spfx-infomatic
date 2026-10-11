<#
.SYNOPSIS
  Creates the optional "InfomaticSteps" sample list for the Infomatic web part and seeds
  seven generic rows (fictional content) so the infographic ring looks like the sample.

.EXAMPLE
  .\create-infomatic-list.ps1 -SiteUrl https://contoso.sharepoint.com/sites/Intranet -ClientId <app id>
#>
param(
  [Parameter(Mandatory = $true)] [string] $SiteUrl,
  [Parameter(Mandatory = $true)] [string] $ClientId,
  [string] $ListTitle = 'InfomaticSteps'
)

$ErrorActionPreference = 'Stop'
Connect-PnPOnline -Url $SiteUrl -ClientId $ClientId -Interactive -WarningAction SilentlyContinue

$list = Get-PnPList -Identity $ListTitle -ErrorAction SilentlyContinue
if (-not $list) {
  $list = New-PnPList -Title $ListTitle -Template GenericList -OnQuickLaunch:$false
  Write-Host "Created list $ListTitle"
}

$fields = (Get-PnPField -List $ListTitle).InternalName
if ($fields -notcontains 'Description') { Add-PnPField -List $ListTitle -DisplayName 'Description' -InternalName 'Description' -Type Note -AddToDefaultView | Out-Null }
if ($fields -notcontains 'Icon')        { Add-PnPField -List $ListTitle -DisplayName 'Icon' -InternalName 'Icon' -Type Text -AddToDefaultView | Out-Null }
if ($fields -notcontains 'Category')    { Add-PnPField -List $ListTitle -DisplayName 'Category' -InternalName 'Category' -Type Text -AddToDefaultView | Out-Null }
if ($fields -notcontains 'SortOrder')   { Add-PnPField -List $ListTitle -DisplayName 'SortOrder' -InternalName 'SortOrder' -Type Number -AddToDefaultView | Out-Null }

$rows = @(
  @{ Title = 'Notify';      Icon = 'Ringer';    Category = 'Step 01'; SortOrder = 1; Description = 'Announce the initiative and who is involved.' },
  @{ Title = 'Plan';        Icon = 'Work';      Category = 'Step 02'; SortOrder = 2; Description = 'Agree scope, owners and the timeline.' },
  @{ Title = 'Reach';       Icon = 'Globe';     Category = 'Step 03'; SortOrder = 3; Description = 'Share with every region and team site.' },
  @{ Title = 'Ideate';      Icon = 'Lightbulb'; Category = 'Step 04'; SortOrder = 4; Description = 'Collect ideas and shortlist the strongest.' },
  @{ Title = 'Assign';      Icon = 'Contact';   Category = 'Step 05'; SortOrder = 5; Description = 'Name a lead for each workstream.' },
  @{ Title = 'Measure';     Icon = 'PieDouble'; Category = 'Step 06'; SortOrder = 6; Description = 'Track adoption and report monthly.' },
  @{ Title = 'Tune';        Icon = 'Settings';  Category = 'Step 07'; SortOrder = 7; Description = 'Adjust settings from what the numbers say.' }
)

$existing = (Get-PnPListItem -List $ListTitle -Fields Title).Count
if ($existing -eq 0) {
  foreach ($r in $rows) { Add-PnPListItem -List $ListTitle -Values $r | Out-Null }
  Write-Host "Seeded $($rows.Count) rows"
} else {
  Write-Host "List already has $existing rows — nothing seeded"
}
Write-Host "Done. Set the web part's List title to '$ListTitle'."
