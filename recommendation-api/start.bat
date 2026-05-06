@echo off
echo ========================================
echo  Starting Event Recommendation API...
echo ========================================
cd /d "%~dp0"
py -m pip install -r requirements.txt --quiet
echo.
echo API running at: http://localhost:5050
echo Docs available: http://localhost:5050/docs
echo.
py main.py
pause
