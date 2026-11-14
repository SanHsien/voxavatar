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
