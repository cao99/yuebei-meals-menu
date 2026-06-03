# 构建与部署流程

## 整体架构

```
源码 (Vue 3 + Tailwind CSS v4)
  │
  ├── vite build              ──┐
  │                              ├─ 标准前端构建
  ├── @vitejs/plugin-legacy    ──┘
  │
  ├── node postbuild.mjs      ── 微信浏览器兼容处理
  │
  └── netlify deploy          ── 上传到 Netlify CDN
```

---

## 第 1 步：Vite 构建 (`vite build`)

构建入口是 `vite build && node postbuild.mjs`（`package.json` 中的 `build` 脚本）。

### 执行命令

```bash
cd baby-menu-frontend
npm run build
```

等价于：

```bash
vite build && node postbuild.mjs
```

**做的事：**

- `@vitejs/plugin-vue` → 编译 `.vue` SFC 为 JS
- `@tailwindcss/vite` → 将 Tailwind CSS v4 的 `@import "tailwindcss"` 展开为完整 CSS（包含大量 CSS 级联层、CSS 变量、`oklch()` 颜色）
- `@vitejs/plugin-legacy` → 以 `chrome >= 49` 为目标，生成兼容 ES5 的 JS polyfill（因为微信 X5 内核 ≈ Chrome 49）
- `build.target: 'es2015'` → 确保输出 JS 语法兼容
- `base: './'` → 资源路径使用相对路径

**产物：** `dist/` 目录，包含 `index.html` + `assets/*.js` + `assets/*.css`

---

## 第 3 步：Netlify 配置 (`netlify.toml`)

```toml
[build]
command = "npm run build"      # 构建命令
publish = "dist"               # 发布目录

[[redirects]]
from = "/*"
to = "/index.html"
status = 200                   # SPA 历史路由回退
```

SPA 重定向将 `/any-path` 请求都指向 `index.html`，由 Vue Router 处理路由。

---

## 第 4 步：部署到 Netlify

分两种模式：

**Draft Deploy（预览部署）：**
```bash
npx netlify deploy
# → 生成 Preview URL: https://<hash>--<site>.netlify.app
```

**Production Deploy（生产部署）：**
```bash
npx netlify deploy --prod
# → 生成 Production URL: https://<site>.netlify.app
```

**流程：**
1. 读取 `.netlify/state.json` 中的 `siteId`（本地站点绑定）
2. 执行构建命令 `npm run build`
3. 将 `dist/` 目录上传到 Netlify CDN
4. Netlify 自动处理 HTTPS、CDN 分发、重定向规则
