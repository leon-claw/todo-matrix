# Todo Matrix

Todo Matrix 是一个基于艾森豪威尔矩阵的待办优先级工具。

它不是把任务简单堆成一列，而是把每件事放进“重要度 × 紧急度”的坐标里。你可以通过拖动任务，或调整重要度、紧急度数值，让任务在矩阵中重新定位，从而看清现在最该处理什么，哪些事情应该安排时间，哪些只是打断，哪些可以延后或放下。

## 在线使用

- 官网首页：<https://todo-matrix.jianghong.site/>
- Web 应用：<https://todo-matrix.jianghong.site/app/>
- 安装包下载：<https://github.com/leon-claw/todo-matrix/releases>

## 为什么做这个工具

Todo Matrix 解决的核心问题很直接：通过简单的拖拽，就能对任务重新排序。你可以直观看到哪些任务最需要解决，哪些任务可以安排到后面，而不是在一长串清单里反复判断。

Todo Matrix 试图把这个判断显性化：每个任务都有两个核心维度。

- 重要度：这件事是否影响目标、结果或长期计划。
- 紧急度：这件事是否有时间压力、外部催促或即时后果。

当这两个维度被量化后，任务不再只是排成一列，而是落在一个可以观察、调整和复盘的矩阵中。

## 核心方法

Todo Matrix 基于艾森豪威尔矩阵，也就是常说的“四象限法则”。

| 象限 | 判断 | 行动 |
| --- | --- | --- |
| 重要且紧急 | 影响结果，并且需要尽快处理 | 立即处理 |
| 重要不紧急 | 对长期目标重要，但没有马上压过来 | 安排时间 |
| 紧急不重要 | 看起来很急，但价值不高 | 减少打断或委派 |
| 不重要不紧急 | 既不重要，也不急 | 延后、归档或删除 |

在 Todo Matrix 中，任务的位置会随着重要度和紧急度变化而变化。你不需要只靠感觉维护列表顺序，矩阵本身会帮你把优先级关系展示出来。

## 核心功能

- 坐标轴视图：用横轴表示重要度，纵轴表示紧急度。
- 拖拽排序：直接拖动任务点，重新判断它的位置。
- 数值调整：在编辑任务时调整重要度、紧急度，任务会回到新的矩阵位置。
- 子任务：把一个任务拆成更具体的执行步骤。
- 进度跟踪：记录任务完成度，区分待办、进行中和已完成。
- 本地模式：无需账号即可开始，任务保存在当前设备。
- 云端模式：登录后按账号同步任务，适合跨设备使用。
- 导入导出：支持通过 JSON 备份和恢复任务数据。
- 多端使用：支持 Web/PWA、Windows、Android 等使用场景。

## 适合谁

- 待办很多，但很难判断先做什么的人。
- 同时处理学习、工作、个人事务的人。
- 想用四象限方法管理任务，但不想只停留在纸面分类的人。
- 需要在电脑和手机之间延续同一套任务优先级的人。

## 应用与平台

当前主要入口是 Web/PWA，可以直接在浏览器中使用，也可以安装到桌面或移动设备。

项目同时包含 Windows、Android、Electron、Capacitor 等客户端相关代码，用于生成原生安装包或承载 Web 资源。微信小程序前端代码保留在 `wechat-miniprogram` 目录中，复用同一套后端 API。

## 项目结构

```text
.
├── src/                 # 主应用前端
├── server/              # Express API
├── prisma/              # 数据库模型与迁移
├── site/                # 官网首页，独立 SSG 构建
├── electron/            # Windows / 桌面端相关代码
├── android/             # Android 原生工程
├── scripts/             # 构建、发布与 OTA 脚本
├── public/              # 主应用静态资源
└── wechat-miniprogram/  # 微信小程序前端
```

## 本地开发

需要准备：

- Node.js 20 或更新版本
- npm
- Docker Desktop

复制环境变量：

```powershell
copy .env.example .env
```

启动数据库：

```powershell
docker compose up -d
```

初始化数据库：

```powershell
npm run db:generate
npm run db:deploy
```

分别启动后端和前端：

```powershell
npm run dev:server
npm run dev:client
```

常用验证命令：

```powershell
npm run test
npm run build
```

## 官网首页开发

官网首页位于 `site/`，与主应用分开构建和部署。

```powershell
cd site
npm install
npm run dev
npm run build
```

`site` 的生产构建会生成静态 HTML，便于搜索引擎直接读取首页内容。根域名首页和 `/app/` 主应用的部署边界见 `deploy.md`。

## 部署

当前推荐的线上路径是：

- `/`：官网首页，来自 `site` 构建产物。
- `/app/`：主应用工作台，来自根目录主应用构建产物。
- `/api/`：后端 API 反向代理。

详细部署、发布、OTA、安装包构建流程见：

- `deploy.md`

## 技术栈

- React
- TypeScript
- Vite
- Express
- Prisma
- MySQL / MariaDB
- ECharts
- Electron
- Capacitor

## License

This project is licensed under the MIT License. See `LICENSE` for details.
