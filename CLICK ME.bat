@ECHO OFF
WHERE node
IF %ERRORLEVEL% NEQ 0 start "" ./res/html/pleaseinstallnode.html
cd ./res/nodeserver
npm i 
node server

pause