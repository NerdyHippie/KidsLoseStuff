@echo off

mkdir apps-script
mkdir public

echo Creating README...
(
echo # Kids Lose Stuff
echo.
echo Lost and Found gallery for schools.
echo.
echo Setup:
echo 1. Create Google Sheet with tabs:
echo    items
echo    claims
echo    admins
echo.
echo 2. Create Drive folder for images
echo.
echo 3. Paste IDs into Code.gs
echo.
echo 4. Deploy Apps Script Web App
echo.
echo 5. Paste URL into public/app.js and admin.js
) > README.md

echo Creating Apps Script files...

(
echo const SHEET_ID = '1z8yJ6ZM9Rs11KG6pKdG8J1_tdLRCy3MVF9lxJL-pnuQ';
echo const PHOTO_FOLDER_ID = '1GLI_Bdnoa2-YMCCL4oQ2V824hUDdTm9s';
echo.
echo function doGet(e^) {
echo   return ContentService.createTextOutput("API running");
echo }
) > apps-script\Code.gs

(
echo {
echo   "timeZone": "America/New_York",
echo   "dependencies": {},
echo   "exceptionLogging": "STACKDRIVER",
echo   "runtimeVersion": "V8"
echo }
) > apps-script\appsscript.json

echo Creating frontend...

(
echo ^<!DOCTYPE html^>
echo ^<html^>
echo ^<head^>
echo ^<title^>Kids Lose Stuff^</title^>
echo ^<link rel="stylesheet" href="styles.css"^>
echo ^</head^>
echo ^<body^>
echo ^<h1^>Kids Lose Stuff^</h1^>
echo ^<div id="gallery"^>Loading...^</div^>
echo ^<script src="app.js"^>^</script^>
echo ^</body^>
echo ^</html^>
) > public\index.html

(
echo body {
echo   font-family: Arial;
echo   margin: 40px;
echo }
echo #gallery {
echo   display: grid;
echo   grid-template-columns: repeat(auto-fill,200px);
echo   gap:20px;
echo }
) > public\styles.css

(
echo const API_URL = "PASTE_APPS_SCRIPT_WEB_APP_URL";
echo.
echo async function load() {
echo   const res = await fetch(API_URL);
echo   const data = await res.text();
echo   document.getElementById("gallery").innerText = data;
echo }
echo.
echo load();
) > public\app.js

echo Setup complete!
pause