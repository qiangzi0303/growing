# 拍照试卷分类实施计划

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement. Do not commit or publish.

**Goal:** 数学、英语、物理上传试卷自动识别考试类型，单元测试关联真实单元，允许核对并持久保存。

**Architecture:** 复用整卷视觉识别，新增受校验的 classification 元数据。三科共用接口和页面，整卷分类不覆盖逐题单元及历史。

**Tech Stack:** Cloudflare Worker TypeScript、D1 SQLite、现有 JavaScript 页面、node:test、Miniflare、浏览器行为验证。

## 共同接口契约

`classification` 包含 `examType: 'midterm'|'final'|'unit'|'other'|'unknown'`、`unitIds: string[]`、`termName: string`、`confidence: number`、`unitConfidence: number`、`evidence: string`、`warnings: string[]`、`confirmed: boolean`、`source: 'ai'|'manual'|'legacy'`。服务端返回完整默认值，旧卷默认 unknown/legacy/confirmed=false。非单元类型 unitIds 必须为空。

识别模型顶层返回 classification。证据或置信度不足、目录非法、学科/册次冲突时，不自动关联；保留明确警告。服务端可增加受校验的识别学科字段检测学科冲突。确认接口接收 `{studentId,title,classification:{examType,unitIds,termName}}`，拒绝跨学科/跨册次单元与非法组合。旧客户端仅传 title 的确认请求继续兼容。GET 列表和详情均返回 classification，详情同时返回当前学科可选目录 `units: {id,title,subject,termName}[]`，前端不复制目录。

## Task 1：后端分类、物理与迁移

Files: `cloudflare/src/question-bank.ts`、`cloudflare/src/photo-assessment.ts`、新增 `cloudflare/src/paper-classification.ts`、新增 `cloudflare/migrations/0016_paper_classification.sql`、新增 `cloudflare/test/paper-classification.test.ts`，必要时相关现有后端测试。

1. 先编写并运行行为测试，证明三科分类、目录校验、确认保存/重开、物理导入当前失败。
2. 新增纯分类校验及提示规则；类型和单元置信度分开校验，明确卷头优先，冲突/未知留待核对；保留缺少分类的旧模型返回兼容。
3. 增加安全迁移与持久化，验证已有照片、题目、批改和作答关联完整。不能以删除旧表导致级联丢失；不改旧迁移。
4. 扩展导入、去重、列表、详情、确认的共同契约，补齐物理文字/公式/真实题图规则，避免默认数学几何提示。
5. 运行新增测试、已有英语/拍照测试及 TypeScript 编译。

Commands (cwd `growing/cloudflare`, Node 目录加入进程 PATH):

- `node node_modules/tsx/dist/cli.mjs --test --test-concurrency=1 test/paper-classification.test.ts`
- `node node_modules/typescript/bin/tsc --noEmit`
- `node node_modules/tsx/dist/cli.mjs --test --test-concurrency=1 test/english-papers.test.ts test/photo-review.test.ts`

## Task 2：页面核对、归档展示与物理入口

Files: `platform-web/my-papers.js`、必要时 `platform-web/question-bank.css`、`platform-web/photo-review.js`、`platform-web/question-figures.js`、`app/src/main/assets/web/app-design/catalog.js`、`course-navigation.js`、相关物理资源页、新增 `scripts/paper-classification-ui.test.cjs`。

1. 先写页面行为测试并运行失败，覆盖自动结果、改类型清单元、保存请求、错误、旧卷。
2. 使用上述契约展示分类、待核对、同科同册目录，支持多单元和人工修改；已保存卷允许纠正分类。
3. 三科入口、上下文和返回一致；物理真实题图按裁剪图片保留，不能依赖数学 SVG 或英语专属判断。
4. 保留当前学生/学科切换隔离、原卷、净卷打印、逐题工作台与历史，错误不伪装成功。
5. 运行 `node --check`、页面测试和英语入口回归；同步仅本次修改的内嵌副本和缓存版本。

## Task 3：集成验收与复核

1. 对每项实现做规格复核、质量复核；修复阻断问题。
2. 使用隔离测试数据及模拟视觉结果，浏览器验证三科上传到草稿、核对、保存、重开、列表回显、失败和手机布局；模拟不代表真实识别准确率。
3. 运行 Worker 全套测试和类型检查、相关页面测试；用 `scripts/build-worker-assets.py` 构建静态资源，核对副本一致。
4. 将命令、通过结果、限制记录在本文件中。没有真实卷时如实列出未验证的真实视觉效果。

## 验证记录

### 已完成的实现与复核

- Task 1、Task 2 已实现，独立规格复核 PASS，独立质量复核 Approve。
- 新增后端分类/迁移/三科接口/物理图片隔离行为测试 4 项；新增页面 DOM 行为测试 8 项。实现前已观察失败，再实现通过。
- 物理题图原有的提前返回隐藏问题、跨科编辑校验和物理误走数学格式转换已修复并有回归覆盖。
- AI 结果直接确认保留来源、置信度和识别依据；人工更改标记 manual、置信度归零，原 AI 依据带明确说明保留。
- 迁移保留原父表，用 LegacySubject 保存原受限字段，再扩展三科学科列；已验证旧照片、题目、批改、作答、外键及索引均保留。

### 验证结果

- Worker TypeScript：`tsc --noEmit`，exit 0。
- 页面与入口：分类、英语试卷、物理、课程工具、AI 入口测试合计 42/42 通过。
- 旧 API 回归：56/56 通过。初轮因测试初始化漏执行 0016 导致 4 项失败；补迁移后暴露旧用例允许数学卷跨科编辑的假设，现明确验证跨科 400、同科成功及版本冲突保护，未弱化历史与权限断言。
- 最终资源构建：exit 0，1097 文件、57,261,923 字节，包含 console 生产构建。
- Web 源、Android cloud 副本及 Worker 根目录/learn/cloud 副本六份相关资源哈希一致；物理入口源与构建副本一致。
- 最终静态资源 + 最新 Worker + 隔离 D1 的 Playwright 浏览器验收 PASS，页面异常 0：家长上传三科单元卷、自动关联、确认保留 AI 依据、保存重开、列表真实名称、越权拒绝；人工改为期末卷清除整卷单元但保留逐题单元；孩子读取同一份记录；从学习中心物理目录进入试卷；拍照输入识别期中与待核对；失败保留照片；1440/390/320px 布局。
- 完整 Worker 测试最终结果：151/151 通过，exit 0。

### 验证产物

日志和浏览器脚手架均在项目 `.nmai/tmp/`，未使用生产数据或真实 AI 配置：

- `paper-classification-full-tests-final.log`、`paper-classification-typecheck-final.log`
- `paper-classification-ui-final.log`、`paper-classification-api-final.log`
- `paper-classification-build-final.stdout.log`、`paper-classification-build-final.stderr.log`
- `paper-classification-qa/browser-result.json`、`physics-1440.png`、`physics-390.png`、`physics-320.png`
- `classification-spec-tests-final.log`、`classification-quality-tests.log`、`classification-quality-ui-tests.log`

### 交付边界

已同步本地源码、内嵌资源与 Worker 静态资源；没有提交 Git、部署线上、执行生产迁移或发布 APK。浏览器使用合成照片与模拟视觉结果，仅证明流程和规则有效；未验证真实试卷识别准确率及实体设备相机。隔离浏览器与临时 QA 服务已关闭。
