@ECHO OFF
WHERE node
IF %ERRORLEVEL% NEQ 0 start "" ./res/html/pleaseinstallnode.html
cd ./res/nodeserver
call npm i 
start "" http://localhost:2258
start /WAIT /B node server
pause