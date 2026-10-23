@echo off
setlocal
set "PYTHONUTF8=1"
set "PYTHONUNBUFFERED=1"
set "PYTHONDONTWRITEBYTECODE=1"
set "RELEASE_PYTHON=%GROWING_RELEASE_PYTHON%"
if not defined RELEASE_PYTHON set "RELEASE_PYTHON=D:\AI\numa\python313\python.exe"
if not exist "%RELEASE_PYTHON%" set "RELEASE_PYTHON=python"
"%RELEASE_PYTHON%" "%~dp0scripts\release.py" %*
set "RELEASE_RESULT=%ERRORLEVEL%"
if not "%RELEASE_RESULT%"=="0" echo Release stopped. Review the error and any log path shown above.
if "%~1"=="" pause
exit /b %RELEASE_RESULT%
