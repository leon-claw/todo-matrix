# Todo Matrix — 发布流程指南

## 概述

本文件描述 Todo Matrix 的一键构建与发布流程。
Agent 按此流程操作即可完成一次标准发布。

**核心原则：**
- macOS 端负责构建：macOS DMG + macOS ZIP + Android APK
- Windows 端负责构建：Windows Setup.exe + Windows Portable ZIP
- 产物默认上传到 GitHub Releases **Draft**，不自动发布
- 发布前需与用户确认 tag 版本号

---

## 流程

### 第一步：确认发布版本

向用户提问确认 tag 版本（如 `v1.0.2`），然后检查远程是否已存在：

```bash
# 检查 tag 是否存在
git ls-remote --tags origin <tag>

# 查看远程 Draft / Release 状态
gh release view <tag> --repo leon-claw/todo-matrix --json isDraft,isImmutable,tagName,name,assets
```

可能的结果：

| 状态 | 含义 | 操作 |
|------|------|------|
| tag 不存在 | 新版本 | 需要用户先创建 tag 再继续 |
| Draft 已存在 | 有草稿 | 可上传附加产物 |
| Published 已发布 | 正式版 | 检查是否可追加（isImmutable） |
| 404 | 无此 Release | 用 `gh release create --draft` 新建 |
| isImmutable=true | 不可变 | 无法上传，需告知用户 |

### 第二步：Checkout tag

```bash
cd <repo-dir>
git fetch --tags origin
git checkout <tag>
```

### 第三步：安装依赖

```bash
npm ci
```

### 第四步：按平台构建

#### macOS（构建 macOS + Android 产物）

```bash
# 1. 构建 macOS DMG + ZIP
npm run desktop:make:proxy

# 2. 构建 Android web 资源并同步
npm run build:android

# 3. 编译 Android APK (debug)
chmod +x android/gradlew
cd android && ANDROID_HOME=/Users/leon/android-sdk ./gradlew assembleDebug
cd ..
```

**产物路径：**
- `out/make/Todo Matrix.dmg` → macOS 安装包
- `out/make/zip/darwin/arm64/*.zip` → macOS ZIP
- `android/app/build/outputs/apk/debug/app-debug.apk` → Android APK

#### Windows（构建 Windows 产物）

```bash
# 使用 Squirrel 构建 Windows Setup.exe + ZIP
$env:TODO_MATRIX_USE_SQUIRREL = '1'
npm run desktop:make:proxy
```

**产物路径：**
- `out/make/*/TodoMatrixSetup.exe` → Windows 安装包
- `out/make/zip/*.zip` → Windows 便携版

### 第五步：整理产物

```bash
ARTIFACT_DIR="release-artifacts/<tag>/<platform>"
mkdir -p "$ARTIFACT_DIR"
```

**macOS/Android 产物：**
```bash
cp "out/make/Todo Matrix.dmg" "$ARTIFACT_DIR/todo-matrix-<tag>-macos.dmg"
cp "out/make/zip/darwin/arm64/todo-matrix-darwin-arm64-1.0.0.zip" "$ARTIFACT_DIR/todo-matrix-<tag>-macos.zip"
cp "android/app/build/outputs/apk/debug/app-debug.apk" "$ARTIFACT_DIR/todo-matrix-<tag>-android.apk"
```

**Windows 产物：**
```bash
cp "out/make/TodoMatrixSetup.exe" "$ARTIFACT_DIR/todo-matrix-<tag>-windows-setup.exe"
cp "out/make/zip/todo-matrix-windows-1.0.0.zip" "$ARTIFACT_DIR/todo-matrix-<tag>-windows-portable.zip"
```

**生成校验文件：**
```bash
cd "$ARTIFACT_DIR" && shasum -a 256 ./* > SHA256SUMS-<platform>.txt
```

### 第六步：上传到 GitHub Releases Draft

```bash
# 上传所有产物到已有 Draft
gh release upload <tag> --repo leon-claw/todo-matrix \
  "$ARTIFACT_DIR/todo-matrix-<tag>-macos.dmg" \
  "$ARTIFACT_DIR/todo-matrix-<tag>-macos.zip" \
  "$ARTIFACT_DIR/todo-matrix-<tag>-android.apk" \
  "$ARTIFACT_DIR/SHA256SUMS-apple-mobile.txt" \
  --clobber
```

> **重要：不要发布（publish）！** 保持 Draft 状态，等 Windows 端补充完后再由用户手动发布。
> 使用 `gh release upload`（而非 `gh release create`），上传到已有 Draft。

### 第七步：验证

```bash
gh release view <tag> --repo leon-claw/todo-matrix --json isDraft,assets
```

确认：
- `isDraft: true`（未发布）
- 所有产物 `state: "uploaded"`
- 产物数量正确

---

## 注意事项

### 环境依赖

**macOS 构建：**
- Xcode 已安装
- Android SDK 位于 `/Users/leon/android-sdk`
- JDK 21（Homebrew 安装）
- Node.js + npm
- 代理：`HTTPS_PROXY=http://127.0.0.1:7897`
- ANDROID_HOME=/Users/leon/android-sdk

**Windows 构建（在 Windows 机器上执行）：**
- Node.js + npm
- Git
- 代理：`HTTPS_PROXY=http://127.0.0.1:7897`

### 限制

- **无法交叉编译：** macOS 上不能编译 Windows 安装包，反之亦然
- **Android 签名：** 当前构建的是 debug APK（无签名）。如需 release 签名，需要设置 `ANDROID_KEYSTORE_PATH`、`ANDROID_KEYSTORE_PASSWORD`、`ANDROID_KEY_ALIAS`、`ANDROID_KEY_PASSWORD`
- **iOS：** 需要 Apple Developer 账号（$99/年）及 `IOS_TEAM_ID` 环境变量
- **大文件上传：** DMG/ZIP (~113MB) 上传可能耗时较长，建议单独上传，每次 timeout 设 300s+

### 常用命令速查

```bash
# 查看所有 Releases
gh release list --repo leon-claw/todo-matrix

# 查看某个 Release 详情
gh release view <tag> --repo leon-claw/todo-matrix

# 新建 Draft Release
gh release create <tag> --repo leon-claw/todo-matrix --draft --title "Todo Matrix <tag>"

# 上传产物到已存在的 Release
gh release upload <tag> --repo leon-claw/todo-matrix <file1> <file2> --clobber

# 发布 Draft
gh release edit <tag> --repo leon-claw/todo-matrix --draft=false

# 删除 Release（仅 Draft 可删）
gh release delete <tag> --repo leon-claw/todo-matrix --yes
```

### 远程 Release 状态检查速查表

```bash
# 检查 tag 是否存在远程
git ls-remote --tags https://github.com/leon-claw/todo-matrix.git <tag>

# 检查 Release 是否存在
gh release view <tag> --repo leon-claw/todo-matrix --json isDraft,isImmutable

# 列出所有 assets
gh release view <tag> --repo leon-claw/todo-matrix --json assets
```
