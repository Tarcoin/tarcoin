@echo off
title Generate Tarcoin Lightning Invoice
echo =======================================================
echo          GENERATE TARCOIN LIGHTNING (L2) INVOICE
echo =======================================================
echo.
set /p AMT="Enter amount in TAR to request: "
set /p MEMO="Enter payment description/memo: "
echo.
echo Generating lntar invoice for %AMT% TAR...
"%~dp0lncli.exe" --lnddir="%~dp0data" addinvoice --amt=%AMT% --memo="%MEMO%"
echo.
pause
