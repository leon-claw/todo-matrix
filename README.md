# Todo Matrix

React + Vite + TypeScript TODO 坐标轴应用。未登录时使用浏览器本地 IndexedDB，登录后使用自建后端和 MySQL 云端存储。

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
