# Todo Matrix

一个纯前端 React + Vite + TypeScript PWA starter。应用无后台、无远程 API，任务数据完全保存在当前浏览器的本地 IndexedDB 中，并带有 localStorage 兜底。

## 特性

- React + Vite + TypeScript
- 自定义 Service Worker，生产构建后支持离线访问
- IndexedDB 本地持久化，无账号、无后台、无云同步
- 传统 TODO 列表 + 重要/紧急坐标轴
- 任务可选择是否显示在坐标轴上
- 可拖拽坐标点修改任务的重要程度和紧急程度
- 响应式布局，PC 左侧坐标轴右侧 TODO，移动端上方坐标轴下方 TODO
- PWA manifest，可在支持的浏览器中安装到设备

## 开发

```bash
npm install
npm run dev
```

## 验证离线能力

```bash
npm run build
npm run preview
```

打开 preview 地址后刷新一次，让 Service Worker 完成注册和缓存。之后可在浏览器 DevTools 中切换 Offline，页面仍可访问，已保存的任务仍来自本地存储。
