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

这是 [sfc-ext-ai](https://github.com/philipxiaoxi/sfc-ext-ai-assistant) 的前端模块，通过 UMD 方式动态挂载到咸鱼云宿主页面，在右下角添加一个悬浮的 AI 聊天对话框。

该项目的开发与构建需要基于 [咸鱼云网盘前端](https://github.com/mjt233/saltedfishcloud-frontend) 项目下

## 前置要求

- Node.js 24+

## 配置开发与构建环境

1. 拉取咸鱼云网盘前端项目
    ```bash
    git clone https://github.com/mjt233/saltedfishcloud-frontend.git
    ```
2. 在咸鱼云网盘前端的 `sfc-ext` 目录下拉取本项目到 `sfc-ext-ai`
   ```bash
   cd saltedfishcloud-frontend/sfc-ext &&
   git clone https://github.com/philipxiaoxi/sfc-ext-ai-frontend.git sfc-ext-ai
   ```
3. 安装依赖：在 `sfc-ext-ai` 目录执行
    ```bash
    npm install
    ```
4. 打包构建：在`sfc-ext-ai` 目录执行
   ```bash
   npm run build
   ```
   构建会自动输出到 `../../public/ext/sfc-ext-ai`
   如果在咸鱼云网盘前端项目的`.env`或环境变量中配置了`BACKEND_PATH`，构建完成后也会自动把构建产物复制到的sfc-ext-ai模块中。
5. 开发与调试
    1. 在咸鱼云网盘前端项目的`.env.development`中，给变量`VITE_PLUGINS`的末尾添加`,ai`，确保前端项目启动时能自动加载该插件模块的代码
    2. 启动前端开发服务：在咸鱼云网盘前端项目执行
        ```bash
        npm run dev
        ```
        通过该方式启动开发调试服务，修改代码后Vue组件会自动热更新或自动刷新页面


## 项目结构

```
sfc-ext-ai
├── main.ts                      # 入口：动态挂载对话框
├── api.ts                       # SSE 流式 API 封装
├── model.ts                     # 类型定义
├── components/AiChatDialog.vue  # 对话组件
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
