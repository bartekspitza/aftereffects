@echo off
SETLOCAL ENABLEEXTENSIONS

:: Automatically set the source directory to the directory where this batch file is located
set "sourceDir=%~dp0"

:: Remove the trailing backslash from sourceDir
set "sourceDir=%sourceDir:~0,-1%"

:: Set the destination directory where AE expects scripts
:: Update the path according to your AE version and installation directory
set "destDir=C:\Program Files\Adobe\Adobe After Effects 2024\Support Files\Scripts"

:: Check if the destination directory exists
if not exist "%destDir%" (
    echo Destination directory does not exist: %destDir%
    exit /b
)

:: Create or overwrite symbolic links for all files in the source directory, excluding the batch file itself
for %%x in ("%sourceDir%\*") do (
    if "%%~fx" neq "%~f0" (
        if exist "%destDir%\%%~nxx" (
            :: If the file/link exists in the destination, delete it before creating a new link
            del "%destDir%\%%~nxx"
        )
        mklink "%destDir%\%%~nxx" "%%x"
    )
)

echo.
echo Symbolic links have been created or updated for all applicable files in the source directory.
echo.

ENDLOCAL
