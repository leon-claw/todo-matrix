# Windows NSIS Installer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Squirrel Windows installer with a current-user NSIS wizard while retaining the portable ZIP.

**Architecture:** Electron Forge will continue building the packaged Windows application and ZIP. electron-builder will consume Forge's unpacked Windows directory and create an assisted NSIS installer with directory selection and shortcut options. The release script remains the single Windows build entry point.

**Tech Stack:** Electron Forge, electron-builder, NSIS, PowerShell, Node test runner

---

### Task 1: Lock the NSIS release contract with tests

**Files:**
- Modify: `tests/releaseScripts.test.ts`

- [ ] **Step 1: Write failing assertions**

Assert that the repository:

```ts
assert.equal(packageJson.devDependencies['electron-builder'] !== undefined, true);
assert.equal(packageJson.devDependencies['@electron-forge/maker-squirrel'], undefined);
assert.match(forgeConfig, /MakerZIP/);
assert.doesNotMatch(forgeConfig, /MakerSquirrel/);
assert.match(builderConfig, /oneClick:\s*false/);
assert.match(builderConfig, /allowToChangeInstallationDirectory:\s*true/);
assert.match(builderConfig, /perMachine:\s*false/);
assert.match(builderConfig, /createDesktopShortcut:\s*true/);
assert.match(builderConfig, /createStartMenuShortcut:\s*true/);
assert.match(windowsScript, /electron-builder/);
assert.match(windowsScript, /windows-setup\.exe/);
```

- [ ] **Step 2: Run the focused test and observe failure**

Run:

```powershell
node --import tsx --test tests/releaseScripts.test.ts
```

Expected: FAIL because electron-builder and its NSIS configuration are absent.

### Task 2: Replace Squirrel configuration with NSIS

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `forge.config.cjs`
- Create: `electron-builder.windows.cjs`
- Modify: `scripts/run-electron-forge-with-proxy.mjs`
- Modify: `electron/main.ts`

- [ ] **Step 1: Install build dependencies**

Run:

```powershell
npm.cmd uninstall @electron-forge/maker-squirrel
npm.cmd install --save-dev electron-builder
```

- [ ] **Step 2: Keep Forge focused on package and ZIP**

Remove MakerSquirrel and the `TODO_MATRIX_USE_SQUIRREL` switch. Keep MakerZIP for `win32` and existing macOS makers unchanged.

- [ ] **Step 3: Add the NSIS configuration**

Create `electron-builder.windows.cjs` with:

```js
module.exports = {
  appId: 'site.jianghong.todomatrix',
  productName: 'Todo Matrix',
  directories: { output: 'out/nsis' },
  files: [],
  win: {
    icon: 'assets/branding/todo-matrix-icon.ico',
    target: [{ target: 'nsis', arch: ['x64'] }],
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    runAfterFinish: true,
    shortcutName: 'Todo Matrix',
    artifactName: 'TodoMatrixSetup.${ext}',
  },
};
```

The release script will pass Forge's packaged directory through `--prepackaged`.

- [ ] **Step 4: Remove Squirrel-only application startup handling**

Delete `isSquirrelStartupEvent()` and its conditional branch. Preserve the existing single-instance and Electron startup behavior.

- [ ] **Step 5: Run the focused test**

Run:

```powershell
node --import tsx --test tests/releaseScripts.test.ts
```

Expected: PASS.

### Task 3: Update the Windows release script

**Files:**
- Modify: `scripts/release/build-windows.ps1`
- Modify: `tests/releaseScripts.test.ts`

- [ ] **Step 1: Make Forge package and ZIP the application**

Run the existing Forge make command without Squirrel and locate:

```text
out/todo-matrix-win32-x64/
out/make/zip/win32/x64/*.zip
```

- [ ] **Step 2: Generate NSIS from the prepackaged directory**

Invoke:

```powershell
npx.cmd electron-builder --win nsis --x64 --prepackaged <forge-package-dir> --config electron-builder.windows.cjs
```

Locate `out/nsis/TodoMatrixSetup.exe`, copy it to the versioned release directory, and retain the existing ZIP and checksum naming.

- [ ] **Step 3: Run focused tests**

Run:

```powershell
node --import tsx --test tests/releaseScripts.test.ts
```

Expected: PASS.

### Task 4: Document and verify

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update Windows installer documentation**

Document that the Windows setup executable is an assisted, current-user NSIS installer with selectable location and optional desktop shortcut. Keep the existing build command and artifact names.

- [ ] **Step 2: Run all tests**

Run:

```powershell
npm.cmd test
```

Expected: all tests pass.

- [ ] **Step 3: Build a local test installer**

Use a temporary local tag pointing at `HEAD`, run:

```powershell
npm.cmd run release:build:windows -- -Tag <test-tag> -SkipInstall
```

Expected:

```text
release-artifacts/<test-tag>/windows/todo-matrix-<test-tag>-windows-setup.exe
release-artifacts/<test-tag>/windows/todo-matrix-<test-tag>-windows-portable.zip
release-artifacts/<test-tag>/windows/SHA256SUMS-windows.txt
```

- [ ] **Step 4: Inspect the installer**

Verify the executable is an NSIS installer, is larger than zero bytes, and the checksum file matches both artifacts. Do not publish the test build.
