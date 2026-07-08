<h1 align="center">sfc-ext-ai-assistant / frontend</h1>

<p align="center">
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
  </a>
</p>

<p align="center">
  咸鱼云 AI 助手前端插件 — Vue 3 + Vuetify 浮动对话窗口
</p>

---

## 概述

frontend 是 [sfc-ext-ai-assistant](https://github.com/philipxiaoxi/sfc-ext-ai-assistant) 的前端模块，通过 UMD 方式动态挂载到咸鱼云宿主页面，在右下角添加一个悬浮的 AI 聊天对话框。

## 前置要求

- Node.js 20+

## 构建

```bash
npm install
npm run build
```

产物位于 `dist/`，构建后会自动复制到 `../backend/src/main/assert/static/`。

## 开发

```bash
npm run dev
```

## 项目结构

```
frontend
├── src
│   ├── main.ts                      # 入口：动态挂载对话框
│   ├── api.ts                       # SSE 流式 API 封装
│   ├── model.ts                     # 类型定义
│   └── components/AiChatDialog.vue  # 对话组件
├── vite.config.ts
└── package.json
```

## 技术栈

| 技术        | 用途       |
| ----------- | ---------- |
| Vue 3       | UI 框架    |
| Vuetify 4   | 组件库     |
| Vite        | 构建工具   |
| Sass        | 样式语言   |

## License

[MIT](LICENSE) © philipxiaoxi
