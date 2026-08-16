$filePath = Get-ChildItem "public\الملفات\*مشرفي*.xlsx" | Select-Object -ExpandProperty FullName -First 1
Write-Host "Reading file: $filePath"
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$wb = $excel.Workbooks.Open($filePath)
$ws = $wb.Sheets.Item(1)
$r = $ws.UsedRange
$data = $r.Value2
$wb.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
$data | ConvertTo-Json
