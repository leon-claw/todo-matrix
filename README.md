<p align="center">
  <img src="public/icons/icon-192.png" alt="Todo Matrix" width="96" height="96" />
</p>

<h1 align="center">Todo Matrix</h1>

<p align="center">
  基于艾森豪威尔矩阵的待办优先级工具。
</p>

<p align="center">
  <a href="https://github.com/leon-claw/todo-matrix/releases"><img alt="release" src="https://img.shields.io/github/v/release/leon-claw/todo-matrix?label=release" /></a>
  <a href="LICENSE"><img alt="license" src="https://img.shields.io/github/license/leon-claw/todo-matrix?label=license" /></a>
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" />
  <img alt="PWA" src="https://img.shields.io/badge/PWA-ready-5A0FC8?logo=pwa&logoColor=white" />
  <img alt="platform" src="https://img.shields.io/badge/platform-Web%20%7C%20macOS%20%7C%20Android%20%7C%20Windows-111827" />
</p>

<p align="center">
  简体中文 | <a href="README.en.md">English</a>
</p>

## 它是什么

**Todo Matrix** 是一个完全由 Codex vibe coding 出来的，基于[艾森豪威尔矩阵](https://en.wikipedia.org/wiki/Eisenhower_matrix)的待办优先级工具。它把任务放进“重要度 × 紧急度”的坐标轴里，你可以通过拖拽任务点，或调整重要度、紧急度数值。任务会自动根据价值来排序。

当前支持：

- Web / PWA
- macOS
- Android
- Windows
- 离线使用
- 登录后云端同步
- 私有化服务器

暂不支持：

- iOS

## 快速开始

你可以直接在线使用：

- 官网首页：<https://todo-matrix.jianghong.site/>
- Web 应用：<https://todo-matrix.jianghong.site/app/>
- 安装包下载：<https://github.com/leon-claw/todo-matrix/releases>

如果不想注册账号，也可以直接使用本地模式。任务会保存在当前设备中。登录后可以切换到云端模式，让任务按账号同步。

## 如何开发

准备环境：

- Node.js 20 或更新版本
- npm
- Docker Desktop

安装依赖：

```powershell
npm install
```

复制环境变量：

```powershell
copy .env.example .env
```

启动数据库并初始化 Prisma：

```powershell
docker compose up -d
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

官网首页位于 `site/`，与主应用分开构建：

```powershell
cd site
npm install
npm run dev
npm run build
```

## 部署

推荐线上路径：

- `/`：官网首页，来自 `site` 构建产物。
- `/app/`：主应用工作台，来自根目录主应用构建产物。
- `/api/`：后端 API 反向代理。

详细部署、私有化部署、安装包发布、OTA 发布流程见 [deploy.md](deploy.md)。

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
