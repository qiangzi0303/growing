# 英语试卷与拍照整理 Implementation Plan

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement. 本次不提交 Git、不发布、不访问真实学生数据。用户已要求直接复用数学现有样式及 minimal-learning-ui 流程。

**Goal:** 英语目录与课堂可以进入共享“我的试卷”，完成英语拍照整理、核对保存、原卷查看及净卷打印。

**Architecture:** 沿用现有 QuestionBank、GrowingPapers 与 GrowingPaperReview。试卷保存学科并按学科筛选；英语识别忠实保留英文和阅读材料，原稿及历史继续走同一权限和保存链路。未带学科的旧导入保持数学兼容，未带筛选的旧列表继续兼容。

**Tech Stack:** 原生 HTML/JS/CSS，Cloudflare Worker TypeScript，D1 SQL，Node test/tsx，Playwright/Edge。

## 约定的接口

```js
// 旧请求继续有效；英语入口明确指定学科。
GrowingCloud.openPapers({subject:'english'});
GET /api/question-bank/papers?studentId=<id>&subject=english
POST /api/question-bank/import
// body: {studentId,requestId,pages,mode:'paper',subject:'english'}
// 保存并读取 paper.subject；题目通过父试卷获得学科，unitId 可以未确定。
```

不接受未知 subject，不接受数学单元冒充英语归类。学科筛选不代替学生授权。未指定学科的管理入口提供学科选择；具体卷深链以真实试卷学科显示。

## Task 1: 后端学科与英语识别（独立实现代理）

**Files:** `cloudflare/src/question-bank.ts`、`cloudflare/src/index.ts`、`cloudflare/src/photo-assessment.ts`、`cloudflare/src/photo-review.ts`，新增 `cloudflare/migrations/0015_paper_subject.sql`、`cloudflare/test/english-papers.test.ts`。仅在确有必要时调整其他后端模块。

1. 使用真实本地 Miniflare/D1 与模拟视觉响应，先写失败测试：英语导入与读取、英语/数学筛选、旧数学请求、重复导入按学科隔离、未知学科及跨科单元校验、家长关联与其他学生隔离。
2. 运行 `node_modules/.bin/tsx.cmd --test --test-concurrency=1 test/english-papers.test.ts`（工作目录 `growing/cloudflare`），确认因英语能力缺失而失败。
3. 增加兼容学科迁移；旧记录有安全默认值。给试卷和题目读接口补充学科，加入可选列表筛选，保留旧调用与请求幂等。
4. 从现有真实 question-unit-rules 选英语单元和对应知识点。英语格式保留文本、大小写、空白、材料、小问与原稿定位；不强制几何 SVG。阅读材料和小题可作为完整材料组记录，不能因题数限制截掉小问。英语插图继续能查看与打印，不能被空 SVG 阻塞。
5. 英语导入及后续批改/追问使用英语上下文；单元不确定时仍不混入数学模型或知识点。不改变旧数学的题图、批改与格式行为。
6. 对材料跨页、未作答/模糊、超限不保存部分试卷、原稿与答案隔离增加测试；运行针对性测试至通过，并运行 `npm.cmd run check`。

## Task 2: 复用页面与导航（独立实现代理）

**Files:** `platform-web/my-papers.js`、`platform-web/app.js`、`platform-web/legacy-navigation.js`、`platform-web/index.html`、`console-web/src/features/legacy/links.ts`；`app/src/main/assets/web/app-design/catalog.js`、`units.html`、新增 `english-resources.html`、`course-navigation.js`、`english-course.js`、`english-course.html`、`math-resources.html`；原 Unit 3 `app/src/main/assets/web/word-ops-unit3/index.html`；按需新增 `scripts/english-papers-ui.test.cjs`。

1. 先写并运行失败的导航/挂载行为测试，覆盖英语入口传递 subject、列表过滤、上传 subject、旧导航返回及无授权入口的实际错误提示。
2. 英语目录增加“试卷”，资源页沿用 math-resources.html 的“我的试卷 / 拍照导入”入口；英语课堂和原 Unit 3 都可进入，保留单元及返回。
3. 修改共享 GrowingPapers，保留现有 DOM 布局与 CSS，动态显示学科、选择/筛选学科，并将英语参数送到后端。查看真实卷时校验学科，学生切换和异步请求不能串记录。
4. 保留原有拍摄、相册、多页、预览、核对修改、确认保存、原卷、净卷、打印、保存失败保留照片/草稿、家长选孩子及共享工作台。英语材料与图片必须完整显示和打印。
5. 兼容导航在现有未提交修复基础上增加 subject，不能回退注册/返回/学生选择修复。缓存版本更新；不动用户已有测试改动。
6. 行为测试变绿，运行修改 JS 的 `node --check`、相关 console 单测和类型检查。不要提前复制镜像或运行全量构建，以免与其他代理冲突。

## Task 3: 集成验证和资源同步（主代理）

1. 分别安排需求符合性审查与代码质量审查；先修重要问题，再集成。
2. 用隔离账号/本地 D1 验证真实 HTTP 接口与浏览器：登录、英语入口、上传两页、AI 草稿、核对保存、刷新重开、原卷、净卷打印、原课堂返回；用模拟视觉接口检验真实请求链路。
3. 家长和孩子打开同一卷，其他学生无权访问；数学入口列表及原整理能力回归。检查桌面、390px、320px。
4. `npm.cmd run check`、`npm.cmd test`（`growing/cloudflare`）；按实际修改运行前端测试、类型检查。
5. 将受影响 platform-web 文件同步到 `app/src/main/assets/web/cloud/`。运行 `D:/AI/numa/python313/python.exe growing/scripts/build-worker-assets.py` 生成 Web 资源；此构建会处理生成目录，不运行 sync-web.py。
6. 审核 `git diff --check` 与实际文件变化，保留其他工作。记录真实通过项目、模拟 AI 的验证边界及尚未上线状态。

## 完成条件

用户能在英语部分使用数学同款试卷整理流程，数据与权限正确、材料完整、数学继续可用，生成资源与源码一致。没有用户英语原卷时，以明确的测试夹具验证流程，不声称已核对真实识别质量。

## 实施与验证结果

已完成共享英语试卷入口、学科持久化及筛选、英语识别和批改上下文、纯文字展示、独立插图、净卷打印保护。原数学页面结构及 CSS 保留；旧数学导入和混合卷核对归类继续兼容。需求审查、独立代码质量审查及最终复查通过。

- Worker：`npm.cmd run check` 通过；`npm.cmd test` 最终 **147/147**，日志位于项目根 `.nmai/tmp/english-papers-full-tests-final.log`。
- 前端：`node --test scripts/english-papers-ui.test.cjs` **11/11**；相关 JavaScript 语法检查通过。console 导航测试 **5/5**、类型检查通过。
- 构建：`build-worker-assets.py` 通过；六个共享文件与 Android、public、public/learn/cloud 三份副本逐一核对相同，英语资源页镜像相同；`git diff --check` 通过。
- 真实浏览器与 HTTP：在临时本地 D1、独立学生及家长账号下，通过英语目录入口、两页相册上传、识别失败保留照片并重试、跨页材料与插图、修改题面、确认保存、重新打开、原卷、无答案净卷打印、返回原课堂、看图题订正及追问、缺图仍可查看且拒绝打印、390px/320px 无横向溢出、数学筛选兼容、家长共享和无关学生拒绝访问。结果位于项目根 `.nmai/tmp/english-papers-qa/browser-result.json`，截图在同目录。
- 看图题出站请求实际检查为本次答案加独立题图，不包含旧整页；英文反馈和追问中的 `$`、`____` 保持普通文字。

验证使用本次生成的两页印刷题目夹具和模拟 AI 响应，未核对真实英语试卷识别质量，未测试实体 Android 摄像头。未发布、未执行生产迁移、未提交 Git；上线所需兼容迁移为 `cloudflare/migrations/0015_paper_subject.sql`。
