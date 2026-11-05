@echo off
REM Builds a single-file lordran-companion.exe with PyInstaller (no admin rights needed).
python -m pip install --user -r requirements.txt pyinstaller
python -m PyInstaller --onefile --name lordran-companion --add-data "ds1db;ds1db" lordran_companion.py
echo.
echo Built: dist\lordran-companion.exe
