@echo off
cd /d "c:\Users\user\Desktop\VS CODE專案\ordersome_official_v2.0221"
rem DATABASE_URL 請設定在 .env 檔案，不要寫死在此處
rem 複製 .env.example 並填入正確的連線資訊
start http://localhost:3000
echo Starting dev server... 
echo Open browser to http://localhost:3000
pause
