; Closing a running VoxAvatar before files are replaced or removed.
;
; This replaces electron-builder's stock check. That check kills the app and
; then looks for it only a few more times; while the killed processes are still
; listed it quits, so a silent uninstall removed nothing (2026-11-21: they
; stayed listed, with their files locked, for up to 104.5 s on a busy host).
; Its process queries also go through WMI, which took 16-30 s each there.
;
; Order here: ask the app to quit cleanly, wait, terminate what is left every
; 10 s, and keep waiting. Only when the wait runs out does a silent run stop,
; with exit code 2. nsProcess reads the process list directly (no WMI).
!define VOX_HELPER_FILENAME "voxavatar-audio-listener.exe"
; One step is 500 ms: force after 10 s, give up after 180 s.
!define VOX_FORCE_CLOSE_EVERY_STEPS 20
!define VOX_CLOSE_WAIT_STEPS 360

; 0 when the app or its native helper is still listed. The helper is checked
; too: it outlives a killed app for a while and locks its own executable.
!macro voxFindRunningApp _RESULT
  ${nsProcess::FindProcess} "${APP_EXECUTABLE_FILENAME}" ${_RESULT}
  ${If} ${_RESULT} != 0
    ${nsProcess::FindProcess} "${VOX_HELPER_FILENAME}" ${_RESULT}
  ${EndIf}
!macroend

!macro customCheckAppRunning
  Push $R0
  Push $R1
  Push $R2
  !insertmacro voxFindRunningApp $R0
  ${If} $R0 == 0
    ${If} ${isUpdated}
      ; Allow the app to exit without an explicit request.
      Sleep 1300
    ${ElseIf} ${Cmd} `MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION "$(appRunning)" /SD IDOK IDCANCEL`
      Quit
    ${EndIf}
    DetailPrint "$(appClosing)"
    ${If} ${FileExists} "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
      ; Forwarded to the running instance, which then quits (electron/quit-request.cjs).
      Exec '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" --quit'
    ${EndIf}
    StrCpy $R1 0
    ${Do}
      Sleep 500
      !insertmacro voxFindRunningApp $R0
      ${If} $R0 != 0
        ${ExitDo}
      ${EndIf}
      IntOp $R1 $R1 + 1
      IntOp $R2 $R1 % ${VOX_FORCE_CLOSE_EVERY_STEPS}
      ${If} $R2 == 0
        ${nsProcess::KillProcess} "${APP_EXECUTABLE_FILENAME}" $R2
        ${nsProcess::KillProcess} "${VOX_HELPER_FILENAME}" $R2
      ${EndIf}
      ${If} $R1 >= ${VOX_CLOSE_WAIT_STEPS}
        ${If} ${Cmd} `MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "$(appCannotBeClosed)" /SD IDCANCEL IDRETRY`
          StrCpy $R1 0
        ${Else}
          SetErrorLevel 2
          Quit
        ${EndIf}
      ${EndIf}
    ${Loop}
  ${EndIf}
  ${nsProcess::Unload}
  Pop $R2
  Pop $R1
  Pop $R0
!macroend

; Only remove the per-user registration owned by this exact installation.
!macro customUnInstall
  Push $0
  ; Keep the association throughout an in-place upgrade, including rollback.
  ${IfNot} ${isUpdated}
    ReadRegStr $0 HKCU "Software\Classes\voxavatar\shell\open\command" ""
    ${If} $0 == '$\"$INSTDIR\${APP_EXECUTABLE_FILENAME}$\" $\"%1$\"'
      DeleteRegKey HKCU "Software\Classes\voxavatar"
    ${EndIf}
  ${EndIf}
  Pop $0
!macroend

!macro customInstall
  ; Register even if the user does not launch the app after a silent upgrade.
  WriteRegStr HKCU "Software\Classes\voxavatar" "" "URL:VoxAvatar Protocol"
  WriteRegStr HKCU "Software\Classes\voxavatar" "URL Protocol" ""
  WriteRegStr HKCU "Software\Classes\voxavatar\shell\open\command" "" '$\"$INSTDIR\${APP_EXECUTABLE_FILENAME}$\" $\"%1$\"'
!macroend
