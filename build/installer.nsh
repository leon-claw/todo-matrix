!include nsDialogs.nsh

!ifndef BUILD_UNINSTALLER
  Var DesktopShortcutCheckbox
  Var CreateDesktopShortcut

  !macro customInit
    StrCpy $CreateDesktopShortcut ${BST_CHECKED}
  !macroend

  !macro customPageAfterChangeDir
    Function DesktopShortcutPageCreate
      !insertmacro MUI_HEADER_TEXT "创建桌面快捷方式" "选择是否在桌面创建 Todo Matrix 快捷方式。"
      nsDialogs::Create 1018
      Pop $0
      ${If} $0 == error
        Abort
      ${EndIf}

      ${NSD_CreateCheckbox} 0 20u 100% 12u "创建桌面快捷方式"
      Pop $DesktopShortcutCheckbox
      ${NSD_Check} $DesktopShortcutCheckbox
      nsDialogs::Show
    FunctionEnd

    Function DesktopShortcutPageLeave
      ${NSD_GetState} $DesktopShortcutCheckbox $CreateDesktopShortcut
    FunctionEnd

    Page custom DesktopShortcutPageCreate DesktopShortcutPageLeave
  !macroend

  !macro customInstall
    ${If} $CreateDesktopShortcut == ${BST_CHECKED}
      CreateShortCut "$newDesktopLink" "$appExe" "" "$appExe" 0 "" "" "${APP_DESCRIPTION}"
      ClearErrors
      WinShell::SetLnkAUMI "$newDesktopLink" "${APP_ID}"
    ${Else}
      WinShell::UninstShortcut "$newDesktopLink"
      Delete "$newDesktopLink"
    ${EndIf}
    System::Call 'Shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'
  !macroend

  !macro customFinishPage
    Function StartTodoMatrix
      ${StdUtils.ExecShellAsUser} $0 "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "open" ""
    FunctionEnd

    !define MUI_FINISHPAGE_RUN
    !define MUI_FINISHPAGE_RUN_FUNCTION "StartTodoMatrix"
    !insertmacro MUI_PAGE_FINISH
  !macroend
!endif
