@echo off
title Tarcoin Core Daemon (Layer-1 Node with ZMQ)
echo =======================================================
echo     TARCOIN LAYER-1 NODE (RPC 19332 + ZMQ 28332/28333)
echo =======================================================
echo.
echo Starting Tarcoin Core with Layer-2 ZMQ notifications enabled...
echo.
"%~dp0..\release-windows\tarcoind.exe" -conf="%~dp0tarcoin.conf" -printtoconsole
pause
