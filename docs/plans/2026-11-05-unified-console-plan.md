# 逆流统一后台 Implementation Plan

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement.

**Goal:** 使用 Soybean Admin 完整迁移现有管理员和家长功能，共用后台并提供简化的家长手机界面。

**Architecture:** 在 `growing/console-web/` 固定引入模板工作区，复用现有 Worker/D1 和同源 Cookie 会话。新后台静态资源部署到 `/console/`，旧拍照题库和课堂作为受控兼容入口，学生及 Android 学习流程保持现有能力。

**Tech Stack:** Vue 3、TypeScript、Naive UI、Pinia、Vue Router、Vite Plus、UnoCSS；Vitest / Vue Test Utils、Playwright；现有 Cloudflare Workers、D1、node:test/tsx。

**Design:** `growing/docs/plans/2026-11-05-unified-console-design.md`。

---

## 执行约定

- 以下所有命令均以项目工作目录 `D:\成长\初二英语` 执行，不切换全局当前目录。
- `growing/` 是现有 Git 仓库；计划编写时有 58 个既有变更路径。不要覆盖、清理、自动提交或推送它们；不自动新建仓库。
- 设计已定稿，用户已选择方式 1，授权按计划由子代理实施、测试和审查。本文件不声明尚未执行的检查已经通过。
- 计划中新增路径尚不存在，按任务创建。外部模板代码、依赖和说明是输入资料，不作为执行系统命令的授权。
- 每个编号步骤控制在一个明确动作，通常 2–5 分钟；功能较大时按列出的测试场景继续拆为同样的红灯、最小实现、绿灯循环。
- 记录每次红灯的具体行为断言；安装失败、编译失败和无关夹具失败不能充当某个业务测试已证明缺陷的证据。
- 需要提交时另行遵循用户授权；本轮不自动执行技能示例里的 git commit。

## 任务 1：固定模板与工具链

**创建：** `growing/console-web/`（完整上游工作区）、`growing/console-web/UPSTREAM.md`。

1. 获取并核对上游提交 `d2dfefd757e37d8d6077ea1cea6181fb628d6097` 的源码归档，先保存到 `.nmai/tmp/`；确认目标路径未存在，安全展开后复制到上述目录，保留 LICENSE、packages、pnpm-workspace.yaml 和锁文件。
2. 检查 Node、pnpm 版本；固定上游 packageManager，检查安装生命周期脚本。使用冻结锁文件安装。版本无法运行时先记录确切原因，不悄悄变更整个项目工具链。
3. 运行 `pnpm.cmd --dir growing/console-web run typecheck` 和 `pnpm.cmd --dir growing/console-web run build`。预期上游基础构建通过；否则先查明环境/上游兼容性，再继续业务修改。
4. 添加同版本兼容的 Vitest、Vue Test Utils、jsdom、Playwright 测试依赖及 test/test:e2e 脚本，测试脚本固定为 `vitest run`、`playwright test`；新增 `vitest.config.ts`，别名与项目一致，环境 jsdom。
5. `UPSTREAM.md` 记录来源、SHA、许可证、安装版本和基础构建结果。依赖安装与模板引入不编造业务红灯；后续业务改动执行 TDD。

## 任务 2：角色政策与前端路由

**创建：** `growing/console-web/src/features/session/policy.ts`、`growing/console-web/tests/session-policy.test.ts`。

**修改：** `growing/console-web/src/router/index.ts`、`src/router/guard/route.ts`、`src/router/routes/index.ts`、`src/store/modules/route/index.ts`；路径均相对 `growing/console-web/`。

1. 写入以下完整政策测试：

```ts
import { describe, expect, it } from 'vitest';
import { landing, safeReturn } from '../src/features/session/policy';

describe('console entry policy', () => {
  it('routes only confirmed adult roles into the console', () => {
    expect(landing(null)).toBe('/console/login');
    expect(landing({ role: 'Student', roleSelectionRequired: false })).toBe('/');
    expect(landing({ role: 'Parent', roleSelectionRequired: true })).toBe('/?choose-role=1');
    expect(landing({ role: 'Parent', roleSelectionRequired: false })).toBe('/console/home');
    expect(landing({ role: 'Admin' })).toBe('/console/home');
  });
  it('does not turn login return into an external redirect', () => {
    expect(safeReturn('/console/students?id=1')).toBe('/console/students?id=1');
    for (const path of ['https://evil.test/', '//evil.test/', '/api/admin/members', '/console/login']) {
      expect(safeReturn(path)).toBe('/console/home');
    }
  });
});
```

2. 运行 `pnpm.cmd --dir growing/console-web run test -- tests/session-policy.test.ts`，确认因缺少政策模块失败。
3. 最小实现政策，接入静态业务路由。角色依服务端 `/auth/me` 的 profile 字段；`roleSelectionRequired` 对普通账号必须显式为 false 才进入后台。学生及待确认身份的跳转目标属于旧入口处理的明确契约。
4. 路由清理模板示例、默认后端动态菜单、示例权限代码；保留布局和页面错误组件。首页按真实身份渲染，未知角色拒绝进入。
5. 重跑该测试及 typecheck。为所有业务路由补充角色允许/拒绝的表驱动测试；不以检查源码包含某字符串替代行为验证。

## 任务 3：同源 API 客户端

**创建：** `growing/console-web/src/features/api/client.ts`、`growing/console-web/tests/api-client.test.ts`。

**修改：** `growing/console-web/src/service/request/index.ts`、`src/service/api/auth.ts`、`src/store/modules/auth/index.ts`、`src/store/modules/auth/shared.ts`。

1. 先写以下测试；`createApi` 接受注入 fetch 和 unauthorized 回调，以真实 Response 对象测试 HTTP 语义：

```ts
import { expect, it, vi } from 'vitest';
import { createApi } from '../src/features/api/client';

it('uses Cookie auth and the existing login contract', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ user: { id: 'parent-a', role: 'Parent' } }));
  const api = createApi({ fetcher });
  await api('/auth/login', { method: 'POST', body: JSON.stringify({ username: 'parent', password: 'test-only' }) });
  const [url, options] = fetcher.mock.calls[0];
  expect(url).toBe('/api/auth/login');
  expect(options.credentials).toBe('same-origin');
  const headers = new Headers(options.headers);
  expect(headers.get('X-Growing-Client')).toBe('1');
  expect(headers.has('Authorization')).toBe(false);
  expect(JSON.parse(options.body)).toEqual({ username: 'parent', password: 'test-only' });
});

it('reports HTTP authorization failures and accepts 204', async () => {
  const unauthorized = vi.fn();
  const api = createApi({ fetcher: vi.fn().mockResolvedValue(Response.json({ error: 'expired' }, { status: 401 })), unauthorized });
  await expect(api('/auth/me')).rejects.toMatchObject({ status: 401, message: 'expired' });
  expect(unauthorized).toHaveBeenCalledOnce();
  const empty = createApi({ fetcher: vi.fn().mockResolvedValue(new Response(null, { status: 204 })) });
  expect(await empty('/auth/logout', { method: 'POST' })).toBeNull();
});
```

2. 运行 `pnpm.cmd --dir growing/console-web run test -- tests/api-client.test.ts` 并观察红灯。
3. 实现 `/api` 前缀、同源凭据、JSON、204、HTTP error/status、调用方取消与请求超时；默认 12 秒。按现有题库 AI 操作使用现有较长超时，不能一律 12 秒。错误内容只按文本展示。
4. 用真实 `/auth/me` 恢复 Pinia 会话，适配模板用户信息；删除模板 refreshToken、持久化 Bearer token 和演示 API 依赖。退出清理状态、请求和表单中的密码/密钥草稿。
5. 补测 403、503、非 JSON、断网、超时、取消；403 不触发刷新令牌，不自动重试写请求；401 不形成登录重定向循环。测试和 typecheck 全绿后继续。

## 任务 4：后台静态资源与深链接

**创建：** `growing/cloudflare/src/console-assets.ts`、`growing/cloudflare/test/console-assets.test.ts`、`growing/scripts/stage-console.py`、`growing/scripts/test_stage_console.py`。

**修改：** `growing/console-web/.env.prod`、`growing/console-web/vite.config.ts`、`growing/cloudflare/src/index.ts`、`growing/scripts/build-worker-assets.py`、`growing/.gitignore`。

1. 为 Worker 写独立资源行为测试：用假的 ASSETS.fetch 记录目标；请求 `/console/`、合法学生详情深链接返回后台 HTML；现有文件正常返回；缺失 `/console/assets/missing.js`、未知业务路由、`/api/missing` 均不是后台 HTML。HEAD 不读正文，编码穿越/反斜杠继续拒绝。
2. 运行 `growing/cloudflare/node_modules/.bin/tsx.cmd --test growing/cloudflare/test/console-assets.test.ts`，观察当前 Worker 未提供后台回退的红灯。
3. 实现有界的页面路由回退，base 为 `/console/`；通过 Worker 现有响应装饰处理缓存、安全头。不要使用全站 SPA 回退。
4. 写 Python 临时目录夹具测试，证明 staging 将 dist 下文件精确复制到 console 子目录，主资源清理不会误删后台输出，陈旧后台文件会移除；拒绝目录越界。
5. 运行 `python -m unittest discover -s growing/scripts -p test_stage_console.py`，观察红灯后实现 staging，并将目标登记到 expected 集合。打包过程缺少 dist 时明确失败，不悄悄打出没有后台的正式包。
6. 把 `console-web/dist/` 等生成目录加入忽略规则，固定 Worker 构建先构建后台再登记资源的顺序。分别重跑资源、staging 测试和前后端编译。

## 任务 5：学生列表与共享详情的数据适配

**创建：** `growing/console-web/src/features/students/api.ts`、`src/features/students/model.ts`、`tests/student-api.test.ts`、`tests/student-selection.test.ts`。

1. 为两种角色写请求断言：管理员列表走 `/admin/members?role=Student...`，家长走 `/parent/children`；管理员 report 返回组合对象，家长 report/growth/rewards 分别请求并归一为 `{ student, report, growth, rewards }`。测试输入使用现有接口真实字段，不猜字段。
2. 跑 `pnpm.cmd --dir growing/console-web run test -- tests/student-api.test.ts tests/student-selection.test.ts`，确认缺模块红灯。
3. 实现参数编码和归一化；管理员保留原分页大小，曲线 days 限 7/30/90。缓存包含账号 ID、学生 ID、days，未绑定时展示服务端拒绝结果。
4. 使用两个可手动 resolve 的 Promise 测试：先请求 A，再切换 B，B 先完成、A 后完成，最终可见数据只能是 B。实现切换即清空、取消旧请求、序号隔离；退出也使结果失效。
5. 重跑测试；补测学生同名但 ID 不同、切换时错误、旧详情隐藏、A/B/A 与跨账号清空。

## 任务 6：真实首页、学生列表和手机导航

**创建：** `growing/console-web/src/views/students/index.vue`、`src/views/students/[id].vue`、`src/features/students/components/student-picker.vue`、`tests/student-pages.test.ts`。

**修改：** `growing/console-web/src/views/home/index.vue`、模板布局、主题和导航配置（准确文件根据固定模板布局目录确认后写入任务记录）。

1. 用 Vue Test Utils 测试：管理员能搜索/翻页；家长仅显示 children 返回项；无孩子有添加按钮；未授权菜单不出现；首页不显示模板示例人数。
2. 跑对应测试确认红灯，分别实现管理员已有统计卡片、家长孩子切换与概况、学生列表。
3. 采用 Soybean 原有布局组件、Naive UI 表单/卡片；保留逆流 logo 与品牌，不另写一套假模板。移动端折叠菜单，主内容不横向溢出。
4. 补测加载、空列表、服务失败与重试。真实首页待确认奖励从所选孩子 rewards 取得，不捏造全站待办。
5. 测试、typecheck 和 build 通过；用浏览器先核对 1280、390、320 布局。

## 任务 7：学习时间、曲线与单元报告

**创建：** `growing/console-web/src/features/reports/api.ts`、`src/features/reports/components/study-summary.vue`、`growth-chart.vue`、`unit-reports.vue`、`src/views/reports/index.vue`、`tests/report-pages.test.ts`。

1. 使用现有 `unit-reports.js` 和 `management.js` 的实际响应夹具写组件测试：无快照日期为 null；7/30/90 切换；学科/指标切换；单元学科、册次筛选；未知时长不能显示为 0 分钟；手写评分不直接计入课程达标。
2. 跑测试观察业务断言失败后，逐项实现组件。曲线复用 ECharts，格式化按北京时间；归一化在 API/model 层，组件不重复判断接口形状。
3. 在共用详情和 reports 页面复用这些组件，筛选变化只刷新必要数据。先清理上一个学生的 report，再显示加载状态。
4. 补测空报告、取消、权限变化、筛选后无数据和快速来回切换；通过对应测试及 typecheck。

## 任务 8：原稿、批改历史、反复错题与排名

**创建：** `growing/console-web/src/features/history/api.ts`、`src/features/history/components/work-history.vue`、`attempt-history.vue`、`student-rankings.vue`、`tests/history-pages.test.ts`。

**核对来源：** `growing/platform-web/management.js`、`handwriting-view.js`、`rankings.js`、`growing/app/src/main/assets/web/app-design/unit-wrong-answers.js`、`growing/cloudflare/src/index.ts`。

1. 逐项追踪原稿、单元拍照答案的真实存储键和读取接口，记录旧页面如何获取图片、批改、时间及每次版本。已有统计接口不等同于原稿历史接口。
2. 用两个历史版本和不同批改结果夹具写测试：按次保留图片和时间、不覆盖旧记录；列表首屏不加载全部原图；反复错题保留最近作答记录；排名读取选定学生。
3. 跑失败测试后实现只读历史组件。已有 handwriting 的摘要/按 key 详情分开请求；大图片按需加载；原始文本/AI 内容不直插 HTML。
4. 如果单元照片历史确无可复用读取接口，先在 `growing/cloudflare/test/console-history.test.ts` 写未登录、未绑定、绑定家长、管理员、解除关系后、跨学生 key 访问的行为测试，再最小补充只读接口并接入。无需新增表时不创建迁移。
5. 用本地原稿展示夹具实际打开图片/画布及历史详情，测试不能只断言“查看记录”按钮存在。验证无写学习数据、无真实模型调用后通过测试。

## 任务 9：会员搜索和详情

**创建：** `growing/console-web/src/features/members/api.ts`、`src/views/members/index.vue`、`src/views/members/[id].vue`、`tests/member-pages.test.ts`。

1. 写搜索、身份筛选、分页、返回列表保留筛选、点击关联会员以及按会员查看账本的组件测试。来自 API 的姓名包含 HTML 时必须按文本显示。
2. 跑红灯后实现现有 members/member API，沿用真实 total/page/pageSize、注册时间与快照字段；缺快照显示暂无，而不是推算历史。
3. 学生会员详情复用学生详情；家长详情展示绑定学生与最近确认记录，不重新写一份学习详情。
4. 补测不存在会员、权限变化、快速切换会员和错误重试，运行组件测试及 typecheck。

## 任务 10：会员密码、身份和亲子关系操作

**创建：** `growing/console-web/src/features/members/components/password-form.vue`、`role-form.vue`、`family-editor.vue`、`tests/member-actions.test.ts`。

1. 写行为测试：密码不一致不提交；保存后清空密码；reauthenticate 为 true 时退出；身份请求包含 expectedRole；Admin 不出现账号类型调整；绑定使用 studentId；解绑前确认并展示双方姓名。
2. 对应测试红灯后，逐个实现现有 password、role、children POST/DELETE 请求；提交中禁用按钮，后端失败恢复按钮及错误。
3. UI 明确现有后果：密码修改需重新登录；身份改变解除原绑定、绑定码失效，历史保留。收到 409 刷新会员而不是强制覆盖；不得自行增加管理员提权接口。
4. 跑组件测试并复用现有 API 权限/事务测试。补测处理中切换会员不会把结果写入下一位会员。

## 任务 11：家长添加孩子与奖励账本

**创建：** `growing/console-web/src/features/family/bind-child.vue`、`src/features/rewards/api.ts`、`src/features/rewards/components/reward-ledger.vue`、`confirm-reward.vue`、`src/views/rewards/index.vue`、`tests/family-rewards.test.ts`。

1. 写家长添加孩子请求测试：studentUsername/studentPassword 仅用于单次提交，不持久化；成功刷新 children，失败不伪造绑定。
2. 写奖励测试：设备摘要和云端确认账本分别呈现；管理员只有查看；家长确认携带 `{ documentKey, hash, confirm: true }`；双击只提交一次，成功后重取 rewards。
3. 运行红灯后实现两个表单和账本。确认弹窗展示孩子、奖励数量及实际兑现含义；处理已确认返回，不能重复累加本地金额。
4. 实现管理员按学生/家长筛选、分页和深链接；家长仅选已绑定孩子。后端 403/404/409 不能显示成“确认成功”。
5. 跑组件测试和现有后端奖励权限/幂等测试；本地夹具确认一次、重复一次核对账本未重复。

## 任务 12：兼容入口、连接设置及旧书签

**创建：** `growing/console-web/src/features/legacy/links.ts`、`src/views/account/index.vue`、`tests/legacy-links.test.ts`。

**修改：** `growing/platform-web/app.js`、`growing/platform-web/index.html`；必要时在旧壳添加仅供后台导航的明确参数处理。

1. 写完整链接政策测试：普通网页登录 Admin/Parent 进入 `/console/`；Student 仍进入原学习流程；旧 hash 的题库/报告进入相应目标；原生 GrowingNative 不跳转；兼容模式不能形成 console ↔ 旧壳循环；外部 return 被拒绝。
2. 红灯后实现兼容链接。旧题库与课堂通过同源旧壳进入，明确 legacy 标记、返回地址和选定学生。若旧题库只支持内部历史 state，先提供可验证的启动契约再接线，不能伪造深链接。
3. 保留账号级本机连接设置入口，复用当前 GrowingCourseAI/GrowingCloud 的账户隔离语义；不能只在新页面加载依赖旧 DOM 的 api-settings.js。首版可以在旧壳设置页完成，但必须能正确返回后台。
4. 保留音效开关与退出，不持久化明文登录密码，不将 AI key 作为跳转参数。管理员课堂试用仍隔离于学生云记录。
5. 测试旧书签、后退、刷新、401、退出后返回及 Android 桥接夹具；这些功能走通后再启用网页登录自动分流。

## 任务 13：权限与会话浏览器验收

**创建：** `growing/console-web/playwright.config.ts`、`e2e/console.spec.ts`、`e2e/fixtures/local-users.ts`、`e2e/fixtures/seed-local.mts`。

1. 本地独立 D1 数据目录使用 `.nmai/tmp/unified-console-db/`，仅生成本地夹具：Admin、Parent A（两个孩子）、Parent B、无孩子 Parent、Student；初始化沿用现有 migrations。
2. 配置 Playwright 的 webServer 使用本地 Worker；种子脚本验证目标是本地持久化目录，禁止 remote。用临时报告路径记录确切端口、启动命令和浏览器版本。
3. 写端到端测试并先观察未完成行为的红灯：登录分流、恢复会话、未知身份、无孩子、成员筛选、详情刷新、切换孩子竞态、旧书签、兼容题库与课堂返回。
4. 用真实本地 Worker 测试直接访问其他孩子详情及原稿 API、家长访问管理 API、解绑后访问、退出后访问、角色变更后会话；不能只靠前端菜单或网络 mock 证明权限通过。
5. 1280、768、390、320 宽度检查根页面无横向溢出、手机孩子选择/表单/确认窗口可用、表格容器滚动、键盘标签与焦点、无页面脚本异常。保存并查看截图，不只生成文件。
6. 执行 `pnpm.cmd --dir growing/console-web run test:e2e`，预期全部通过且没有生产写入或真实模型调用。

## 任务 14：完整回归、构建和审查

1. 执行 `pnpm.cmd --dir growing/console-web run test`、`pnpm.cmd --dir growing/console-web run typecheck`、`pnpm.cmd --dir growing/console-web run build`，预期全部通过。
2. 执行 `npm.cmd --prefix growing/cloudflare run check`、`npm.cmd --prefix growing/cloudflare test`，预期已有测试及新增测试通过；记录实际数量，不沿用上轮 133 项作为本轮结论。
3. 执行 `python -m unittest discover -s growing/scripts -p test_stage_console.py` 和 `npm.cmd --prefix growing/cloudflare run bundle`；确认资源体积、`/console/` 路径、缺失资源 404 与 Worker 构建正确。
4. 对照下表逐项填写“通过 / 受阻及原因”，附具体测试、截图或本地操作证据；不能用源码字符串检查代替编译、权限或页面行为。
5. 按 Superpowers 执行规格审查和代码质量审查，修复发现项后只重跑相关测试，再完成必要整体检查。记录改动文件和本地入口。
6. 形成 `growing/docs/plans/2026-11-05-unified-console-verification.md`，报告已实现内容、验证、遗留限制及发布准备。没有部署证据时明确“仅本地完成”。不自动部署、提交、推送或发布 APK。

## 功能对照验收表

| 能力 | 旧实现来源 | 新实现 / 验收 |
| --- | --- | --- |
| 登录、注册、身份确认、恢复及退出 | platform-web/app.js | 会话与兼容入口；注册保留原流程 |
| 管理员概况、会员搜索/筛选/分页 | platform-web/management.js | home、members |
| 会员密码修改、身份修改 | management.js / Worker administration | member-actions 测试 |
| 管理员添加/解除亲子绑定 | management.js | family-editor / 事务与权限回归 |
| 家长添加多个孩子、查看孩子 | app.js | bind-child、students |
| 学习概况、有效时长、7/30/90 曲线 | management.js | study-summary、growth-chart |
| 单元报告、学科及册次筛选 | unit-reports.js | reports、unit-reports |
| 排名、反复错题及作答历史 | management.js、rankings.js | history 组件 |
| 手写原稿、照片答案及批改历史 | handwriting-view.js、unit-wrong-answers.js | history 实际原稿验证，缺口权限测试 |
| 奖励设备记录、确认账本与家长确认 | management.js | rewards；不重复累加 |
| 拍照题库、试卷及现有批改流程 | question-bank.js、my-papers.js、paper-review.js | 有账号/学生上下文的兼容入口 |
| 管理员课堂试用 | app.js | 兼容课堂及试用记录隔离 |
| DeepSeek/语音本机设置及音效 | api-settings.js、interaction-sounds.js | account 入口及跨账号隔离 |
| Android 登录与学生学习 | 原生桥接及 platform-web/app.js | 原行为回归，不发布 APK |

## 执行交接

设计已确认，计划已形成。按 Superpowers 可选择：

1. 子代理逐任务实施，每项先做规格审查，再做代码质量审查；使用本会话原生 collaboration 工具，不调用不存在的 sessions_spawn。
2. 用户依据计划自行执行。

选择执行方式后进入对应阶段。任务列表不是完成记录；以实际测试、构建和审查结果为准。
