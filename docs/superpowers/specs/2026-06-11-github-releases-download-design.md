# GitHub Releases Download Design

## Goal

Replace platform-specific application downloads with one direct link to the Todo Matrix GitHub Releases page.

## Behavior

- The "下载应用" row on the Mine page opens `https://github.com/leon-claw/todo-matrix/releases` in the system/external browser.
- The application no longer displays a separate downloads page or platform-specific package cards.
- The `#/mine/downloads` legacy hash is normalized to `#/mine` so old bookmarks and existing OTA clients land on a valid page.
- The README download link points to the same Releases page.

## Scope

- Update the shared Web, Android, and Electron React UI.
- Remove obsolete platform download metadata and icons.
- Keep native installers, OTA publishing, and the frozen WeChat Mini Program unchanged.
- Do not build installers or application packages.

## Verification

- Unit tests cover the canonical Releases URL and legacy route normalization.
- The full test suite and production Web build must pass.
