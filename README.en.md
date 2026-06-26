<p align="center">
  <img src="public/icons/icon-192.png" alt="Todo Matrix" width="96" height="96" />
</p>

<h1 align="center">Todo Matrix</h1>

<p align="center">
  A to-do priority tool based on the Eisenhower Matrix.
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
  <a href="README.md">简体中文</a> | English
</p>

## What It Is

**Todo Matrix** is a to-do priority tool completely vibe-coded with Codex, based on the [Eisenhower Matrix](https://en.wikipedia.org/wiki/Eisenhower_matrix). It places tasks on an "importance × urgency" coordinate system. You can drag task points, or adjust importance and urgency values. Tasks are automatically sorted by value.

Currently supported:

- Web / PWA
- macOS
- Android
- Windows
- Offline use
- Cloud sync after login
- Self-hosted server

Not supported yet:

- iOS

## Quick Start

Use Todo Matrix online:

- Website: <https://todo-matrix.jianghong.site/>
- Web app: <https://todo-matrix.jianghong.site/app/>
- Downloads: <https://github.com/leon-claw/todo-matrix/releases>

You can start without an account by using local mode. Tasks are stored on the current device. After login, you can switch to cloud mode and sync tasks by account.

## Development

Requirements:

- Node.js 20 or later
- npm
- Docker Desktop

Install dependencies:

```powershell
npm install
```

Copy environment variables:

```powershell
copy .env.example .env
```

Start the database and initialize Prisma:

```powershell
docker compose up -d
npm run db:generate
npm run db:deploy
```

Start the API server and client app:

```powershell
npm run dev:server
npm run dev:client
```

Common verification commands:

```powershell
npm run test
npm run build
```

The website homepage lives in `site/` and is built separately from the main app:

```powershell
cd site
npm install
npm run dev
npm run build
```

## Deployment

Recommended production paths:

- `/`: website homepage, built from `site`.
- `/app/`: main app workspace, built from the root app.
- `/api/`: reverse proxy to the backend API.

For deployment, self-hosting, app release, and OTA release details, see [deploy.md](deploy.md).

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
