@echo off
title Tarcoin Lightning Network Daemon (TLN)
echo =======================================================
echo          TARCOIN LAYER-2 LIGHTNING NODE (TLN)
echo =======================================================
echo.
echo Starting Tarcoin LND connected to Tarcoin Core L1 (RPC: 19332, P2P: 19333)...
echo.
"%~dp0tarcoin-lnd.exe" --configfile="%~dp0lnd.conf" --lnddir="%~dp0data"
pause
