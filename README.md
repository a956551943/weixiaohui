# 大阪旅行 2026

2026 年 8 月大阪 5 天 4 晚出行计划。

## 推荐使用方式

| 场景 | 文件 | 说明 |
|------|------|------|
| **手机勾选填写** | [`docs/index.html`](docs/index.html) | 可勾选、可打字，自动保存到本机 |
| 汇报 / 打印 | [`docs/大阪旅行攻略_2026年8月.md`](docs/大阪旅行攻略_2026年8月.md) | 文字版行程 |
| 本地预览网页 | 浏览器打开 `docs/index.html` | 无需联网（填写仍保存在手机本地） |

## 手机访问

### 国内推荐（无需 VPN）

**https://cdn.jsdelivr.net/gh/a956551943/weixiaohui@master/docs/index.html**

> jsDelivr 是国内较稳定的 GitHub 文件镜像，功能与网页版完全相同，可勾选、可填写、自动保存。

### GitHub Pages 官方链接（国外 / 开 VPN 可用）

**https://a956551943.github.io/weixiaohui/**

### 开启 Pages（若官方链接 404）

1. 打开 https://github.com/a956551943/weixiaohui/settings/pages  
2. **Build and deployment → Source** 选 **GitHub Actions**（推荐）  
   或选 **Deploy from branch** → Branch: `master` → Folder: `/docs`  
3. Custom domain 留空，有内容则 **Remove**  
4. 等 2–5 分钟刷新  

推送代码后会自动触发 Actions 部署。

### 仍打不开时

| 方式 | 做法 |
|------|------|
| 微信发文件 | 把 `docs/index.html` 发到微信，手机浏览器打开 |
| 本地打开 | 双击 `docs/index.html` |

### 注意事项

- 网页填写内容保存在**各自手机浏览器**里，换手机不会同步
- 仓库设为 **Public** 才能免费用 GitHub Pages
- 若不想公开行程细节，可建 **Private** 仓库，改用手机本地打开 `index.html`

## 目录结构

```
大阪旅行2026/
├── docs/
│   ├── index.html              ← 手机交互版（GitHub Pages 首页）
│   └── 大阪旅行攻略_2026年8月.md  ← 文字版攻略
├── scripts/
│   ├── fetch_flights.mjs       ← 机票查询
│   └── generate_pdf.mjs        ← PDF 导出（可选）
└── data/
```

## 行程概要

| 项目 | 内容 |
|------|------|
| 日期 | 2026/8/27 — 8/31 |
| 人数 | 3 人 |
| 住宿 | 大阪市中央区日本桥 2-2-23 |
| 去程 | 8/27 08:10 → 11:35 |
| 返程 | 8/31 12:35 → 14:20 |
