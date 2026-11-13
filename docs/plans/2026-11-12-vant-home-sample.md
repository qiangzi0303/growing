# Vant 首页样板 Implementation Plan

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement.

**Goal:** 提供通过 `ui=vant` 启用的真实菜单、设置与学习日历样板，可运行于独立首页、网页账号首页与安卓首页。

**Architecture:** 新建独立 Vue/Vant 库，由旧页面的薄适配器装载。复用原账号动作和配置服务、课程目录、日历收集函数，不迁移业务数据。

**Tech Stack:** Vue 3.5.45, Vant 4.10.2, Vite 8.3.8, @vitejs/plugin-vue 6.0.10, Node 22.18, existing node:test/jsdom and Playwright Chrome.

## Task 1: 构建与 Vue 组件（实现代理）

Files: `learning-ui/package.json`, `learning-ui/package-lock.json`, `learning-ui/vite.config.js`, `learning-ui/src/index.js`, `learning-ui/src/HomeSample.vue`, `learning-ui/src/style.css`, `learning-ui/test/home-sample.test.js`。

1. 初始化包与精确版本依赖、构建脚本、忽略dist/node_modules；遵守设计文档的mount适配器契约。
2. 写行为测试：挂载44px三杠与真实Vant菜单；设置保存调用适配器且不回显密钥，空输入保留语义；关闭取消测试并清草稿；日历加载真实collect结构且不写记录；异常有可见反馈；destroy清理。测试导入尚未存在的组件确认失败。
3. 用 Vue SFC 实现菜单、两类密钥表单和单元日历；Vant Picker选单元、Calendar选日期；只读摘要保留日期/时长/阅读/评分/练习/历史基线/首次达标曲线。
4. `npm run test` 通过；`npm run build` 生成IIFE `{mount}` 和CSS到dist，报告大小。不自动提交。用原生代理工具交还根代理做集成与审查。

## Task 2: 原业务接入（主代理）

Files: `app/src/main/assets/web/app-design/vant-home.js`, `scripts/vant-home.test.cjs`, `scripts/build-learning-ui.mjs`, `app/src/main/assets/web/app-design/index.html`, project `app-design/index.html`, `platform-web/index.html`, `platform-web/app.js`, `platform-web/native-menu.js`, `scripts/build-worker-assets.py`。

1. 写jsdom失败测试：普通页面不加载；opt-in独立页/外壳/安卓只显示一个菜单；身份或页面变更销毁并恢复；回调复用真动作；读取正确账户存储。
2. `node --test growing/scripts/vant-home.test.cjs` 确认缺失入口失败。
3. 实现适配器，外壳在courseReady发事件供入口接入；原菜单权限、退出与设备动作复用。捕获账号存储并使用配置服务现有验证。保存的密钥不传给组件。
4. 增加可重现build/stage脚本，将库产物与适配器同步到源码素材、安卓与Worker；构建Worker前运行样板构建。无CDN、无依赖安装到全局、无需执行sync-web覆盖旧源。
5. 跑针对性node测试和Vue/Vant构建，确认通过。

## Task 3: 验收与两阶段审查

Files: `.nmai/tmp/verify-vant-home-20261112.py`, `docs/plans/2026-11-12-vant-home-sample-verification.md`。

1. Chrome真实运行320/390/1440独立首页和真实登录外壳样板，保存截图与报告，读取既有fixture密码但不输出凭据。
2. 验证保存/空密钥沿用/确认清除、Voice音色、Esc/焦点、只读日历/切换单元和月份、未登录与家长权限、离线设置日历、资源失败回退、无重复菜单、安卓桥接模拟；记录真机未测。
3. 规格代理只读审查实际实现对设计；再由质量代理检查账户隔离、异步生命周期、构建重复与错误处理，修复重要问题并回归受影响检查。
4. 最终整体审查与验收记录，给用户可直接打开的预览链接。所有变更留工作区，不提交、不发布。
