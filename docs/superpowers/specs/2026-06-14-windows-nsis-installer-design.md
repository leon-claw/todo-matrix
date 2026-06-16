# Windows NSIS Installer Design

## Goal

Replace the current Squirrel.Windows installer with a conventional NSIS
installer while preserving the existing portable ZIP and all non-Windows
release workflows.

## User Experience

The Windows installer will:

- Install for the current user without requiring administrator privileges.
- Show a conventional installation wizard.
- Allow the user to choose the installation directory.
- Always create a Start Menu shortcut.
- Offer a desktop shortcut that is selected by default and can be disabled.
- Offer to launch Todo Matrix when installation finishes.
- Display the existing Todo Matrix icon and product name.

The portable ZIP remains available for users who do not want installation.

## Build Architecture

Windows packaging will use a focused hybrid pipeline:

- Electron Forge continues to package the application and generate the
  Windows portable ZIP.
- `electron-builder` consumes the packaged Windows application and generates
  the NSIS installer.
- Squirrel.Windows and its conditional maker configuration are removed.
- macOS DMG/ZIP, Android, iOS, OTA, and web build behavior remain unchanged.

The Windows release script remains the public entry point:

```powershell
npm run release:build:windows -- -Tag v1.2.0
```

It will produce:

```text
release-artifacts/v1.2.0/windows/
├── todo-matrix-v1.2.0-windows-setup.exe
├── todo-matrix-v1.2.0-windows-portable.zip
└── SHA256SUMS-windows.txt
```

## Configuration

The NSIS configuration will be stored in the repository and will specify:

- Per-user installation mode.
- Assisted installer mode rather than one-click mode.
- Changeable installation directory.
- Desktop shortcut enabled by default.
- Start Menu shortcut enabled.
- Post-install launch enabled.
- Existing ICO branding.

The build version will be derived from the Git tag supplied to the Windows
release script, without requiring source edits for each release.

## Application Startup

The custom `--squirrel-*` startup check will be removed because NSIS does not
use Squirrel lifecycle arguments. The normal single-instance and Electron
startup flow remains unchanged.

## Failure Handling

The Windows release script will fail clearly when:

- The requested Git tag does not exist or does not point to `HEAD`.
- The worktree is dirty.
- Forge fails to package the application or generate the portable ZIP.
- electron-builder fails to generate the NSIS installer.
- Any expected artifact is missing.

Checksums are generated only after both distributable formats exist.

## Verification

Automated tests will verify:

- Squirrel configuration and dependencies are absent.
- The NSIS configuration uses assisted, per-user installation.
- The Windows release script invokes both Forge ZIP packaging and
  electron-builder NSIS packaging.
- Expected artifact names and checksums remain stable.

Manual verification on Windows will confirm:

- The installer shows the directory selection step.
- Desktop shortcut selection defaults to enabled.
- Start Menu and optional desktop shortcuts launch Todo Matrix.
- The application can launch from the installer's final page.
- Uninstall removes the installed application.
- The portable ZIP still launches independently.

Installer binaries will not be committed to Git.
