# Todo Matrix

React + Vite + TypeScript TODO 坐标轴应用。未登录时使用浏览器本地 IndexedDB，登录后使用自建后端和 MySQL 云端存储。

> 📦 下载安装包：[GitHub Releases](https://github.com/leon-claw/todo-matrix/releases)

## 功能

- 本地模式：无需账号，任务保存在当前设备。
- 云端模式：邮箱密码登录，任务按账号隔离保存在 MySQL。
- 云端账号支持登录后修改密码。
- 注册流程包含图片验证码，用于第一版的基础防刷。
- 登录后如果发现本地任务，会先要求选择：用本地覆盖云端，或删除本地保留云端。
- ECharts 重要/紧急坐标轴，支持拖拽修改指标。
- PWA shell 缓存，生产构建后可安装到设备。
- `wechat-miniprogram` 目录提供微信小程序前端，复用同一套后端 API。

## 本地开发

### 1. 准备环境

需要安装：

- Node.js 20 或更新版本
- npm
- Docker Desktop

复制环境变量：

```powershell
copy .env.example .env
```

`.env.example` 默认使用本机 Docker MySQL：

```env
DATABASE_URL="mysql://todo_matrix:todo_matrix_dev@127.0.0.1:3306/todo_matrix"
SERVER_PORT=3001
COOKIE_NAME=todo_matrix_session
SESSION_DAYS=30
```

### 2. 启动数据库

```powershell
docker compose up -d
```

如果第一次启动后立刻执行迁移遇到 `P1017: Server has closed the connection`，通常是 MySQL 还没完全就绪，等待十几秒后重新执行迁移即可。

### 3. 初始化 Prisma

```powershell
npm run db:generate
npm run db:deploy
```

开发过程中如果修改了 `prisma/schema.prisma`，使用：

```powershell
npm run db:migrate
```

### 4. 启动应用

分别启动后端和前端：

```powershell
npm run dev:server
npm run dev:client
```

默认地址：

- 前端：Vite 终端输出的本地地址，通常是 `http://127.0.0.1:5173`
- 后端：`http://127.0.0.1:3001`
- API：前端开发环境下的 `/api` 会代理到后端

### 5. 验证构建

```powershell
npm run build
```

如果只想验证前端生产包和离线 shell：

```powershell
npm run preview
```

## 部署流程

当前项目是“前端静态资源 + Node.js API + MySQL”的部署形态。推荐部署时使用 HTTPS，因为 PWA 安装和 service worker 在生产环境通常要求 HTTPS。

### 1. 准备服务器

服务器需要：

- Node.js 20 或更新版本
- 可访问的 MySQL 8.x
- 反向代理，例如 Nginx、Caddy 或云厂商网关
- HTTPS 证书

MySQL 可以使用云数据库，也可以继续用 Docker：

```powershell
docker compose up -d
```

生产环境建议把数据库密码、端口开放范围、备份策略单独配置好，不要直接沿用开发默认密码。

### 2. 配置生产环境变量

在服务器上创建 `.env`：

```env
DATABASE_URL="mysql://todo_matrix:your_password@127.0.0.1:3306/todo_matrix"
SERVER_PORT=3001
COOKIE_NAME=todo_matrix_session
SESSION_DAYS=30
NODE_ENV=production
```

如果前端和后端部署在同一个域名下，推荐让反向代理把 `/api` 转发到 Node.js 服务，其余路径返回前端静态资源。

### 3. 安装依赖并生成 Prisma Client

```powershell
npm ci
npm run db:generate
```

### 4. 执行数据库迁移

```powershell
npm run db:deploy
```

这一步会把 `prisma/migrations` 中的迁移应用到生产数据库。上线前建议先备份数据库。

### 5. 构建前端

```powershell
npm run build
```

构建产物会输出到 `dist`。后端 API 源码在 `server/src`，可以用 `tsx`、`node --import tsx`、PM2、Docker 或其他进程管理方式运行。

一个简单的 Node 启动方式：

```powershell
npx tsx server/src/index.ts
```

生产环境更推荐使用进程管理器，例如 PM2：

```powershell
npm install -g pm2
pm2 start "npx tsx server/src/index.ts" --name todo-matrix-api
pm2 save
```

### 6. 反向代理

反向代理需要完成两件事：

- `/api/*` 转发到 `http://127.0.0.1:3001`
- 其他请求返回 `dist` 中的前端静态文件

Nginx 示例：

```nginx
server {
  listen 443 ssl http2;
  server_name your-domain.example;

  root /var/www/todo-matrix/dist;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

### 7. PWA 安装检查

部署后确认：

- 站点使用 HTTPS。
- `/manifest.webmanifest` 可以访问。
- `/sw.js` 可以访问。
- 浏览器开发者工具里 service worker 注册成功。
- Chrome / Edge 桌面端可以点击地址栏安装图标，iOS Safari 使用分享菜单里的“添加到主屏幕”。

## Android / Windows OTA 发布流程

热更新发包需要做两件事：

1. 本地构建 `manifest.json` 和对应版本的 `dist.zip`。
2. 把这些文件上传到生产静态资源目录，让客户端可以通过固定 URL 拉取。

客户端默认访问的地址是：

```text
https://web.jianghong.site/app/todo-matrix/ota/android/manifest.json
https://web.jianghong.site/app/todo-matrix/ota/windows/manifest.json
```

所以服务器上需要有一个静态目录映射到：

```text
https://web.jianghong.site/app/todo-matrix/ota/
```

例如服务器目录 `/var/www/web/app/todo-matrix/ota` 应该能访问到：

```text
/var/www/web/app/todo-matrix/ota/android/manifest.json
/var/www/web/app/todo-matrix/ota/android/<version>/dist.zip
/var/www/web/app/todo-matrix/ota/windows/manifest.json
/var/www/web/app/todo-matrix/ota/windows/<version>/dist.zip
```

### 推荐：一键构建并发布

先只构建不上传，用来检查产物：

```powershell
npm run release:ota -- --version 2026.06.05.3 --dry-run
```

如果生产静态目录就在当前机器上：

```powershell
npm run release:ota -- --version 2026.06.05.3 --publish-dir C:\nginx\html\app\todo-matrix\ota
```

如果需要通过 SSH 上传到服务器：

```powershell
npm run release:ota -- --version 2026.06.05.3 --ssh-host user@server --ssh-path /var/www/web/app/todo-matrix/ota
```

发布到其他 URL 时，用 `--base-url` 指定 OTA 根地址：

```powershell
npm run release:ota -- --version 2026.06.05.3 --base-url https://example.com/app/todo-matrix/ota --ssh-host user@server --ssh-path /var/www/example/app/todo-matrix/ota
```

只发布某一个端：

```powershell
npm run release:ota -- --version 2026.06.05.3 --channels android --ssh-host user@server --ssh-path /var/www/web/app/todo-matrix/ota
npm run release:ota -- --version 2026.06.05.3 --channels windows --ssh-host user@server --ssh-path /var/www/web/app/todo-matrix/ota
```

脚本会先删除本地 `ota` 临时目录，再重新构建 Android 和 Windows OTA 包，然后上传：

```text
ota/android/manifest.json
ota/android/<version>/dist.zip
ota/windows/manifest.json
ota/windows/<version>/dist.zip
```

这些都是构建产物，已经被 `.gitignore` 忽略，不需要提交到 Git。

发布后检查：

```powershell
curl.exe https://web.jianghong.site/app/todo-matrix/ota/android/manifest.json
curl.exe https://web.jianghong.site/app/todo-matrix/ota/windows/manifest.json
```

确认 `latestWebBundleVersion` 是本次版本号，并且 `webBundleUrl` 指向的 `dist.zip` 可以下载。

## Android 静默热更新

Android 端使用 Capacitor Web 资源静默更新。第一版只更新 `dist` 里的 HTML、JS、CSS、图片等 Web 资源，不更新原生代码、权限、Capacitor 插件或 APK 本身。

### 更新检查策略

- 仅 Android 原生运行时启用，Web、Electron、小程序不会执行。
- 启动时调用一次检查。
- 自动检查有 6 小时本地节流。
- 只处理 manifest 中 `webPolicy: "silent"` 的 Web bundle。
- 下载完成后调用 updater 的 `next`，新版会在下次应用进入后台 / 重启后生效，不会立刻刷新当前页面。
- 如果 manifest 要求的 `minNativeVersion` 高于当前壳版本，则不会应用 Web bundle，需要发新版 APK。

默认 manifest 地址：

```text
https://web.jianghong.site/app/todo-matrix/ota/android/manifest.json
```

临时指定其他地址：

```powershell
$env:TODO_MATRIX_OTA_MANIFEST_URL="https://example.com/app/todo-matrix/ota/android/manifest.json"
npm run build:android
```

### 生成热更新包

```powershell
npm run build:android:ota -- --version 2026.06.05.1
```

默认会生成：

```text
ota/android/2026.06.05.1/dist.zip
ota/android/manifest.json
```

把整个 `ota/android` 目录上传到生产静态资源目录，让下面两个地址可以访问：

```text
https://web.jianghong.site/app/todo-matrix/ota/android/manifest.json
https://web.jianghong.site/app/todo-matrix/ota/android/2026.06.05.1/dist.zip
```

如果热更新文件部署在其他域名或路径：

```powershell
npm run build:android:ota -- --version 2026.06.05.1 --base-url https://example.com/todo-matrix/ota/android
```

manifest 示例：

```json
{
  "latestNativeVersion": "1.0.0",
  "latestWebBundleVersion": "2026.06.05.1",
  "minNativeVersion": "1.0.0",
  "nativePolicy": "none",
  "webPolicy": "silent",
  "webBundleUrl": "https://web.jianghong.site/app/todo-matrix/ota/android/2026.06.05.1/dist.zip",
  "sha256": "..."
}
```

发布纪律：

- UI、文案、普通前端逻辑、接口兼容适配可以走 Web 静默更新。
- 新增 Android 权限、原生代码、Capacitor 插件、登录安全策略、隐私采集、应用核心用途变化，必须发新版 APK。

## Windows 静默热更新

Windows 端使用 Electron Renderer Web 资源静默更新。第一版只更新前端页面资源，不更新 Electron 主进程、preload、Node 依赖、原生模块、安装包或系统权限。

### 更新检查策略

- 仅 Windows 生产包启用，本地 Electron 开发模式不会执行。
- 启动时检查一次 manifest，自动检查有 6 小时本地节流。
- 只处理 manifest 中 `webPolicy: "silent"` 的 Web bundle。
- 下载完成后校验 `sha256`，写入待生效版本；新版会在下次启动时加载。
- 新版启动后会自动上报 ready；如果新版未成功上报 ready，下次启动会回滚到上一个可用版本或内置版本。
- 运行时使用固定的 `todo-matrix://renderer` 协议加载页面，避免热更新资源路径变化影响本地存储。

默认 manifest 地址：

```text
https://web.jianghong.site/app/todo-matrix/ota/windows/manifest.json
```

如果需要在打包 Windows 安装包时临时指定其他 manifest：

```powershell
$env:TODO_MATRIX_DESKTOP_OTA_MANIFEST_URL="https://example.com/app/todo-matrix/ota/windows/manifest.json"
npm run desktop:package
```

### 生成热更新包

```powershell
npm run build:windows:ota -- --version 2026.06.05.1
```

默认会生成：

```text
ota/windows/2026.06.05.1/dist.zip
ota/windows/manifest.json
```

把整个 `ota/windows` 目录上传到生产静态资源目录，让下面两个地址可以访问：

```text
https://web.jianghong.site/app/todo-matrix/ota/windows/manifest.json
https://web.jianghong.site/app/todo-matrix/ota/windows/2026.06.05.1/dist.zip
```

如果热更新文件部署在其他域名或路径：

```powershell
npm run build:windows:ota -- --version 2026.06.05.1 --base-url https://example.com/todo-matrix/ota/windows
```

发布纪律：

- UI、文案、普通前端逻辑、接口兼容适配可以走 Windows 静默更新。
- 修改 Electron 主进程、preload、桌面 API 代理、Node 依赖、原生模块、安装包配置、系统权限或安全策略时，必须重新发布 Windows 安装包。

## 常用排查

- `P1017`：MySQL 尚未完全就绪，稍等后重新执行 `npm run db:deploy`。
- 登录后没有云端数据：确认后端服务运行中，且前端 `/api` 能正确转发到后端。
- 注册验证码一直失败：刷新验证码后重新输入；验证码是一次性的，注册失败后需要使用新验证码。
- 无法安装到设备：确认 HTTPS、manifest、service worker 都能访问；如果浏览器不支持网页内安装弹窗，请从浏览器菜单手动安装。
- 小程序登录后业务接口 `401`：确认登录接口响应中包含 `token`，并重启后端服务；微信开发者工具里也可以清除小程序 storage 后重新登录。

## 微信小程序前端

小程序前端在 `wechat-miniprogram` 目录中，使用微信原生小程序语法实现，后端仍然复用本项目的 Express API 和 MySQL 数据库。

### 已实现能力

- 邮箱密码登录 / 注册。
- 注册图片验证码。
- 修改密码。
- 本地模式：使用小程序本地 storage 保存任务。
- 云端模式：使用后端数据库保存任务，账号隔离。
- 登录后发现本地任务时，可选择上传覆盖云端，或删除本地保留云端。
- TODO 列表、筛选、编辑、删除确认、进度/重要/紧急滑块。
- 原生 canvas 坐标轴，支持拖拽节点修改重要程度和紧急程度。

### 本地运行

1. 先启动后端和数据库：

```powershell
docker compose up -d
npm run db:deploy
npm run dev:server
```

2. 打开微信开发者工具，导入 `wechat-miniprogram` 目录。

3. 本地开发默认 API 地址在：

```js
// wechat-miniprogram/config.js
API_BASE_URL: 'http://127.0.0.1:3001/api'
```

4. 本地调试时，在微信开发者工具里勾选“不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书”。

真机调试不能使用 `127.0.0.1` 访问电脑后端，需要改成局域网 IP 或已部署的 HTTPS 域名。

## 多平台原生安装包发布

Windows 安装包必须在 Windows 构建；macOS 和 iOS 必须在 Mac 构建。项目采用以下发布方式：

1. 所有机器检出同一个 Git Tag。
2. Windows 构建完成后创建 GitHub Draft Release，并上传 Windows 产物。
3. Mac 构建 macOS、Android、iOS 产物，并继续上传到同一个 Draft Release。
4. 检查产物完整后，由 Mac 将 Draft Release 正式发布。

安装包只存放在 GitHub Release，不提交到 Git 仓库。本地产物统一生成到：

```text
release-artifacts/<tag>/
```

该目录已经加入 `.gitignore`。

### 1. 创建统一版本 Tag

在准备发布的提交上创建并推送 Tag：

```powershell
git status
git tag -a v1.2.0 -m "Todo Matrix v1.2.0"
git push origin v1.2.0
```

两台构建机器都必须检出同一个 Tag：

```bash
git fetch origin --tags
git checkout v1.2.0
```

构建脚本会检查：

- Tag 必须存在。
- 当前 `HEAD` 必须正好是该 Tag 指向的提交。
- 工作区必须没有未提交修改。

### 2. Windows 构建

在 Windows 机器执行：

```powershell
npm run release:build:windows -- -Tag v1.2.0
```

默认会先执行 `npm ci`，随后生成：

```text
release-artifacts/v1.2.0/windows/
├─ todo-matrix-v1.2.0-windows-setup.exe
├─ todo-matrix-v1.2.0-windows-portable.zip
└─ SHA256SUMS-windows.txt
```

已经执行过 `npm ci` 时，可以跳过依赖安装：

```powershell
npm run release:build:windows -- -Tag v1.2.0 -SkipInstall
```

### 3. 创建 Draft Release 并上传 Windows 产物

发布脚本直接调用 GitHub API，不依赖 `gh` CLI。先创建一个 Fine-grained personal access token，授权 `leon-claw/todo-matrix` 仓库，并赋予：

```text
Repository permissions > Contents: Read and write
```

在 PowerShell 中临时设置 Token：

```powershell
$env:GITHUB_TOKEN="github_pat_xxx"
```

创建 Draft Release 并上传 Windows 产物：

```powershell
npm run release:github -- --tag v1.2.0 --create-draft --dir release-artifacts/v1.2.0/windows
```

脚本会复用同名 Release；同名产物已存在时会先删除旧文件再上传，因此失败后可以安全重试。

### 4. Mac 构建环境

Mac 服务器需要安装：

- Node.js 20 或更高版本
- Xcode 和 Xcode Command Line Tools
- Android SDK、JDK 17
- 有效的 Apple Developer 账号及签名证书
- Android 发布签名 keystore

Android 签名通过环境变量提供：

```bash
export ANDROID_KEYSTORE_PATH="/absolute/path/todo-matrix-release.jks"
export ANDROID_KEYSTORE_PASSWORD="your-store-password"
export ANDROID_KEY_ALIAS="todo-matrix"
export ANDROID_KEY_PASSWORD="your-key-password"
```

iOS 使用 Xcode 自动签名：

```bash
export IOS_TEAM_ID="YOUR_APPLE_TEAM_ID"
export IOS_EXPORT_METHOD="app-store-connect"
```

`IOS_EXPORT_METHOD` 可根据发布方式设置为 `app-store-connect`、`ad-hoc` 或 `development`。

### 5. Mac、Android、iOS 构建

在 Mac 检出同一个 Tag 后执行：

```bash
npm run release:build:mac -- --tag v1.2.0
```

默认生成：

```text
release-artifacts/v1.2.0/apple-mobile/
├─ todo-matrix-v1.2.0-macos.dmg
├─ todo-matrix-v1.2.0-macos.zip
├─ todo-matrix-v1.2.0-android.apk
├─ todo-matrix-v1.2.0-android.aab
├─ todo-matrix-v1.2.0-ios.ipa
└─ SHA256SUMS-apple-mobile.txt
```

当前仓库尚未提交 `ios/` 原生工程。第一次在 Mac 初始化时执行：

```bash
npm run release:build:mac -- --tag v1.2.0 --init-ios
```

初始化完成后脚本会停止，不会用临时生成且尚未审核的工程发布 IPA。应检查 Xcode 中的 Bundle ID、Signing、Capabilities 和应用图标，将 `ios/` 目录提交，创建新的发布 Tag，再重新执行正式构建。正式发布不应依赖临时初始化。

如果本次暂不发布 iOS：

```bash
npm run release:build:mac -- --tag v1.2.0 --skip-ios
```

已经安装过依赖时：

```bash
npm run release:build:mac -- --tag v1.2.0 --skip-install
```

### 6. 上传 Mac、Android、iOS 产物

在 Mac 设置相同的 GitHub Token：

```bash
export GITHUB_TOKEN="github_pat_xxx"
```

将产物补充到 Windows 已创建的 Draft Release：

```bash
npm run release:github -- --tag v1.2.0 --create-draft --dir release-artifacts/v1.2.0/apple-mobile
```

这里继续使用 `--create-draft` 是安全的：Release 已存在时只会上传或替换产物，不会创建第二个 Release。

### 7. 正式发布

先在 GitHub Draft Release 页面检查所有平台文件和 SHA256 文件。确认无误后，在 Mac 执行：

```bash
npm run release:github -- --tag v1.2.0 --publish --dir release-artifacts/v1.2.0/apple-mobile
```

`--publish` 会先确保指定目录里的产物已经上传，然后把同一个 Draft Release 改为公开状态。最终只会产生一个 GitHub Release。

如需指定其他仓库：

```bash
npm run release:github -- --tag v1.2.0 --create-draft --repo owner/repository --dir release-artifacts/v1.2.0/windows
```

如需使用手写 Release Notes：

```bash
npm run release:github -- --tag v1.2.0 --create-draft --notes-file RELEASE_NOTES.md --dir release-artifacts/v1.2.0/windows
```

未提供 `--notes-file` 时，首次创建 Draft Release 会使用 GitHub 自动生成的 Release Notes。

### 生产配置

小程序上线前需要：

- 把 `wechat-miniprogram/project.config.json` 里的 `appid` 改成真实小程序 AppID。
- 把 `wechat-miniprogram/config.js` 的 `API_BASE_URL` 改成 HTTPS API 域名，例如 `https://api.example.com/api`。
- 在微信公众平台配置“request 合法域名”。
- 后端部署 HTTPS，并确保 `/api/auth/captcha/:id.svg`、登录注册、任务接口都能访问。

也可以保留源码里的本地开发地址，使用构建命令生成生产目录：

```powershell
npm run build:wechat
```

默认会生成 `wechat-miniprogram/dist`，并把 `config.js` 中的 API 地址替换为：

```text
https://web.jianghong.site/app/todo-matrix/api
```

如果要临时指定其他生产 API：

```powershell
$env:WECHAT_API_BASE_URL="https://example.com/app/todo-matrix/api"
npm run build:wechat
```

之后用微信开发者工具导入 `wechat-miniprogram/dist` 目录，再上传发布。

### 登录会话说明

Web 端继续使用 HttpOnly Cookie。小程序端无法依赖浏览器 Cookie，所以登录和注册接口会额外返回 `token`，小程序保存到本地 storage，并在后续请求里通过：

```http
Authorization: Bearer <token>
```

访问同一套后端 API。
