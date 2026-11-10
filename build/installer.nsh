; Included by electron-builder's NSIS installer (electron-builder.yml → nsis.include).
;
; The app runs its local Next.js server as a second "Lordran Tracker.exe" process
; (ELECTRON_RUN_AS_NODE). During an auto-update the installer starts while that process
; may still be shutting down, and the stock check then stops with "Lordran Tracker could
; not be closed — close it manually and click Retry". Close it ourselves instead: ask
; politely first (lets the window save and exit), then force-end whatever is left, and
; give Windows a moment to release the files before installing over them.
!macro customCheckAppRunning
  nsExec::Exec 'taskkill /IM "${APP_EXECUTABLE_FILENAME}"'
  Pop $0
  Sleep 1500
  nsExec::Exec 'taskkill /F /T /IM "${APP_EXECUTABLE_FILENAME}"'
  Pop $0
  Sleep 1000
!macroend
