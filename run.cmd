(
start "" /B cmd /c ping localhost -n 6 ^>nul
timeout /t 5 /nobreak
start "" /B /D "C:\users\username\Desktop" cmd /c dir ^> dr.txt ^2^>^&^1
start "" /B cmd /c ping localhost -n 11 ^>nul
timeout /t 10 /nobreak
) | pause
Echo waited
timeout /t 12 /nobreak
