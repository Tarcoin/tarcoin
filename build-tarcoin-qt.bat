@echo off
echo ============================================
echo  TARCOIN Qt Windows Build
echo ============================================

call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat" -arch=x64 -host_arch=x64

set CMAKE="C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe"
set VCPKG_ROOT=C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\vcpkg
set VCPKG_TOOLCHAIN="%VCPKG_ROOT%\scripts\buildsystems\vcpkg.cmake"
set SRC=D:\TARCOIN\blockchain_core\tarcoin-core
set BUILD=%SRC%\build-windows

echo.
echo [1/3] Configuring CMake with vcpkg...
echo VCPKG: %VCPKG_ROOT%
echo CMAKE: %CMAKE%
echo.

%CMAKE% -B "%BUILD%" -S "%SRC%" ^
  -DCMAKE_TOOLCHAIN_FILE="%VCPKG_ROOT%\scripts\buildsystems\vcpkg.cmake" ^
  -DVCPKG_TARGET_TRIPLET=x64-windows-static ^
  -DCMAKE_BUILD_TYPE=Release ^
  -DBUILD_TESTS=OFF ^
  -DBUILD_BENCH=OFF ^
  -DBUILD_GUI=ON

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] CMake configure failed with code %ERRORLEVEL%
    exit /b 1
)

echo.
echo [2/3] Building tarcoin-qt.exe (this takes 30-60 min)...
%CMAKE% --build "%BUILD%" --config Release -j %NUMBER_OF_PROCESSORS%

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build failed with code %ERRORLEVEL%
    exit /b 1
)

echo.
echo [3/3] Collecting .exe files...
mkdir D:\TARCOIN\release-windows 2>nul
for /r "%BUILD%" %%f in (*.exe) do (
    echo Copying: %%~nxf
    copy "%%f" "D:\TARCOIN\release-windows\" >nul
)

echo.
echo ============================================
echo  BUILD COMPLETE!
echo ============================================
dir D:\TARCOIN\release-windows\
