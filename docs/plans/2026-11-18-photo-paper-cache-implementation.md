# 拍照试卷归档、诊断、目录提醒和本地缓存实施计划

状态：2026-11-18 已完成本地实现、资源同步、独立规格与质量复审。未提交、未发布。验证结果见 `2026-11-18-photo-paper-cache-verification.md`。

> 实施者使用 TDD：先运行新失败用例，后实现，再运行针对性回归。使用 Codex 原生子代理，当前用户授权不含提交或发布。

目标：把拍照试卷的实际错误接入单元错题和图谱诊断，并通过学生隔离的本地缓存避免重复拉取大数据和重复 AI 调用。

架构：服务端复用题目/批改表形成统一错误证据；前端使用共享查询与事件更新。缓存是可丢弃的 IndexedDB 层，只有服务端正式记录才作为成绩来源。

技术：Cloudflare Worker TypeScript / D1，原生 JS 控制器，Vue/Vant，IndexedDB，Node test、tsx、Playwright。

## 任务 A：本地缓存与 AI 结果

文件：新增 `platform-web/paper-cache.js`、`scripts/paper-cache.test.cjs`；修改 `platform-web/app.js`、`index.html`、`student-paper-ai.js`、`paper-ai.js` 及对应测试。先不修改发布副本。

1. 失败测试覆盖跨实例持久复用、过期、学生/访问者隔离、权限撤销、并发失效、容量失败、任务不缓存。
2. 实现有界 IndexedDB 缓存（内存回退），明确白名单资源、TTL、缓存 schema；AI 成功结果按当前题目版本复用，重新生成绕过。
3. 在 app API 边界接入缓存。请求身份必须捕获并在完成后校验。家长管理员命中前调用 `GET /question-bank/cache-access?studentId=...`；学生本人依赖当前有效会话。认证错误清理对应访问者缓存。
4. GET 白名单包含 papers、questions、单题 review/figures、paper-graph、unit-summary、attempt-stats。import-jobs 及授权接口不缓存。POST/PUT/DELETE 相关变更先后都防止旧缓存回填。
5. 提供 `cache: 'reload'` 绕过和学生范围失效方法供界面刷新。Bridge 暴露可选 `paperCache`，缺失时正常在线。
6. `node --test --test-force-exit scripts/paper-cache.test.cjs`、学习 UI AI 控制器回归通过。

## 任务 B：统一错题证据与三学科诊断 API

文件：`cloudflare/src/question-bank.ts`、`photo-review.ts`、`paper-ai.ts`、`index.ts` 及相关新旧测试。可提取小型共享模块。

1. 失败测试覆盖当前版本有效错误、订正正确、待复核不清除既有待订正、跨单元/重复题号、旧归档个人记录、三学科和权限。
2. 统一待订正证据查询，复用主单元及 confidence>=0.8 的真实知识关联；`tested` 不当作 `gap`。待归类单独保留。
3. `/question-bank/unit-summary?studentId=...&subject=...` 返回 `{studentId,subject,units:[{id,wrongCount}],pendingCount}`。wrongCount 是当前未解决的个人错题去重数。
4. `/question-bank/paper-graph?studentId=...&subject=...&paperId=...` 保留兼容默认 math；提供问题 `needsCorrection`、可靠 `nodeIds`、`gapNodeIds`、`unitIds`、错误原因、来源和历史状态；节点/单元包含对应计数。不返回照片及大作答正文。
5. 单元错题 GET `questions?...&wrong=1` 使用相同待订正规则；跨单元引用同题，不复制；允许有有效批改证据的旧草稿，未批改草稿仍不可误判。
6. 原卷 AI 批改持久化，按题目版本及请求 ID 幂等，输出兼容旧面板的完整结果；重试不重复计分。新增 cache-access 只做原有 authorize 并返回 `{authorized:true}`，不返回个人数据。
7. 运行对应 tsx API/证据测试和 `tsc --noEmit`。

## 任务 C：上传、诊断和单元提醒 UI

文件：`platform-web/student-paper-pages.js`、`learning-ui/src/StudentPaperPages.vue`、`StudentCatalog.vue`，APK 源 `student-pages.js`、`student-catalog-model.js`、课程错题入口/控制器、图谱控制器，相关测试。

1. 失败测试覆盖默认上传 grade、三学科单元摘要、红点消失/重现、切换账号不串数据、API 失败状态、试卷诊断选题跳转。
2. 上传试卷使用已有 grade 任务，显示整理并批改；老卷保留继续/逐题批改途径。
3. 从已有授权 bridge 获取 unit-summary，一次批量获取；目录标题旁显示红点及可访问描述。归档/批改事件和返回页面触发刷新，不改掌握度。
4. 单元错题入口接通云端待订正列表，保留原先静态教学档案；点击云题使用原有批改工作台。
5. 试卷页提供本卷知识图谱诊断，可按单元/知识点筛选，标识薄弱证据并返回原题。复用真实三学科知识目录；无证据不能显示已掌握。
6. 主动刷新绕过本地缓存；刷新、批改、返回目录后状态一致。
7. 运行对应 Node 控制器/组件测试，构建 Vue。

## 集成与审查

根代理整合相互依赖的 bridge/API，执行规格复核和质量复核，修复阻断问题。同步精确修改到根预览与 APK/网页副本，构建共享 UI。最后用浏览器手机/桌面夹具验证缓存命中无重复网络、归档/图谱/红点及修改失效，报告实际测试与真实 AI/安卓真机的验证边界。
