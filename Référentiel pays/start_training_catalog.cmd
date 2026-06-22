@echo off
setlocal
cd /d "%~dp0"

set "NODE_EXE=C:\Users\PC\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%NODE_EXE%" set "NODE_EXE=node"

echo Starting country risk demo on http://127.0.0.1:8787
echo Keep this window open while using the demonstrator.
echo.
"%NODE_EXE%" "%~dp0server.js"
