; Included by electron-builder's NSIS installer and uninstaller (electron-builder.yml →
; nsis.include). customCheckAppRunning replaces the stock "is the app running?" check and
; runs at the start of install — before the previous version's uninstaller — and of uninstall.

; 1. Close the app. Its local Next.js server is a second "Lordran Tracker.exe" process
;    (ELECTRON_RUN_AS_NODE) that can still be shutting down when an auto-update starts the
;    installer. Ask politely first (lets the window exit cleanly), then force-end the rest.
;
; 2. Remove runtime leftovers in the install folder before the old uninstaller runs:
;    Next.js' image cache (.next/cache) and any "resources\app-server.*" side folders. Their
;    hashed file names can exceed Windows' 260-character path limit, which NSIS can't
;    delete. The old uninstaller then fails, and the installer reports it as "Lordran
;    Tracker could not be closed". `rd` with the \\?\ prefix handles long paths.
!macro customCheckAppRunning
  nsExec::Exec 'taskkill /IM "${APP_EXECUTABLE_FILENAME}"'
  Pop $0
  Sleep 1500
  nsExec::Exec 'taskkill /F /T /IM "${APP_EXECUTABLE_FILENAME}"'
  Pop $0
  Sleep 1000

  ${if} $INSTDIR != ""
  ${andIf} ${FileExists} "$INSTDIR\resources\*.*"
    nsExec::Exec '"$SYSDIR\cmd.exe" /C rd /s /q "\\?\$INSTDIR\resources\app-server\.next\cache"'
    Pop $0
    nsExec::Exec '"$SYSDIR\cmd.exe" /C for /d %d in ("$INSTDIR\resources\app-server.*") do if /i not "%~nxd"=="app-server" rd /s /q "\\?\%d"'
    Pop $0
  ${endIf}
!macroend
