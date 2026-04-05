@echo off
cd /d "c:\Users\user\Desktop\VS CODE專案\ordersome_official_v2.0221"
set "DATABASE_URL=mysql://2PEiAB7nB6htiep.root:Y9QkbXSPa0Zgulq0@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/ordersome?ssl={\"rejectUnauthorized\":true}"
start http://localhost:3000
echo Starting dev server... 
echo Open browser to http://localhost:3000
pause
