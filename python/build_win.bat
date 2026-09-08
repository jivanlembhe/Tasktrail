@echo off
REM Builds TaskTrail.exe (single file, no console) with PyInstaller.
REM Run this on Windows from the folder containing tasktrail.py.
python -m pip install --upgrade pip
python -m pip install -r requirements.txt pyinstaller
python -m PyInstaller --noconfirm --onefile --windowed --name TaskTrail --icon icon.ico tasktrail.py
echo.
echo Done: dist\TaskTrail.exe
pause
