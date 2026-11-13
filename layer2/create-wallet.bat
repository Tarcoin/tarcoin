@echo off
title Tarcoin Lightning Wallet Initialization
echo =======================================================
echo          TARCOIN LIGHTNING (L2) WALLET CREATOR
echo =======================================================
echo.
echo Initializing your Layer-2 Lightning wallet on Tarcoin Mainnet...
echo You will be asked to enter a wallet password and write down your 24-word recovery seed.
echo.
"%~dp0lncli.exe" --lnddir="%~dp0data" create
pause
