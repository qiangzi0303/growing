# 统一后台本地验收报告

日期：2026-11-05。状态：**本地迁移及验收完成，未上线**。全部任务及附加修复两审完成，整体规格 PASS、质量 APPROVE，无剩余审查问题。

## 范围与边界

按已批准的设计和实施计划，将管理员与家长功能迁移至同源 `/console/`，保留学生课堂、受控旧功能入口和 Android 原有流程。未提交、推送、部署、操作生产数据、调用真实 AI 或发布 APK；保留实施前已有修改。

设计与任务依据：`2026-11-05-unified-console-design.md`、`2026-11-05-unified-console-plan.md`。任务 1–14、输入标签、会话竞态、报告夹具、窄屏排名及日期夹具修复均已完成规格及质量审查，记录在项目 `.nmai/tmp/unified-console-progress.md` 及对应任务报告。任务 13 原生最终进程 exit 0，日期 P2 已关闭；整体规格最终 PASS、质量 APPROVE。

## 最终回归记录

以下日志路径均相对项目工作区 `D:\成长\初二英语`。只有本轮实际执行完成的检查标记通过。

| 检查 | 实际结果 | 证据 |
| --- | --- | --- |
| Worker TypeScript：`npm.cmd --prefix growing/cloudflare run check` | 通过，exit 0 | `.nmai/tmp/console-final-worker-check.log` |
| Worker 完整测试：`npm.cmd --prefix growing/cloudflare test` | 140 项通过，失败/取消/跳过均 0，exit 0，86.83 秒 | `.nmai/tmp/console-final-worker-test.log` |
| Python staging：`python -m unittest discover -s growing/scripts -p test_stage_console.py` | 4 项通过，exit 0 | `.nmai/tmp/console-final-staging-test.log` |
| 前端完整单元测试 | 修复旧报告夹具并两审后，20 个文件、151 项全部通过，exit 0，24.30 秒；首轮 3 个失败及 4 个未处理错误日志保留，未通过修改生产容错掩盖契约 | 最终 `.nmai/tmp/console-final-frontend-test-green.log`；初红 `.nmai/tmp/console-final-frontend-test.log`、`.nmai/tmp/console-final-report-pages-reproduce.log` |
| 前端 TypeScript | 修复后完整重跑通过，exit 0 | `.nmai/tmp/console-final-frontend-typecheck-green.log` |
| 正式前端构建、全资源 stage、Worker bundle dry-run | 一次 `npm.cmd --prefix growing/cloudflare run bundle` 通过，exit 0；custom build 完成前端生产构建及完整 stage，Wrangler 明确 `--dry-run: exiting now`，没有部署 | `.nmai/tmp/console-final-bundle.log` |
| 真实 Worker/D1 浏览器完整验收 | 日期夹具修复后的最终原生 cmd 无过滤套件 32/32 passed（3.8 分钟），exit 0；真实定向 history 与四宽 layout 12/12（1.3 分钟），exit 0。未修改业务及资源；早先 32 项绿仅作为历史 | 最终 `.nmai/tmp/console-date-full32.log`；定向 `.nmai/tmp/console-date-targeted.log`；说明 `.nmai/tmp/console-task13-date-fix.md` |
| 本地夹具安全、SQLite 日期边界及 E2E TypeScript | 日期 SQLite 1 项与本地安全 2 项共 3/3，typecheck exit 0；最终套件结束后 8791 已释放 | `.nmai/tmp/console-date-safety-green.log`、`.nmai/tmp/console-date-typecheck.log` |
| 最终规格审查、质量审查、整体 review | 全部任务及附加修复两审完成；任务 13 日期 P2 关闭；整体规格最终 PASS、质量 APPROVE，无剩余问题 | `.nmai/tmp/console-task13-spec.md`、`.nmai/tmp/console-task13-quality.md`、`.nmai/tmp/console-overall-spec.md`、`.nmai/tmp/console-overall-quality.md` |

## 正式资源产物

实际文件统计：public 共 **1,108 文件、58,635,518 字节**，最大单文件 **5,261,922 字节**，没有超过 25 MiB 的文件，数量低于 20,000。console 共 **77 文件、4,414,368 字节**，与本次 `console-web/dist` 全文件逐字节比较，缺失、陈旧及内容不一致均为零。证据：`.nmai/tmp/console-final-assets.json`。本轮完整产物不能沿用之前临时 stage 的 53 文件数量。

构建日志未出现 warning。Worker bundle 为 1,456.81 KiB（gzip 281.35 KiB）；这是 dry-run 打包统计，不是部署成功或生产上传证据。Wrangler 日志的扫描数 1,138 与脚本及独立实际文件统计 1,108 不同；发布文件大小和数量以独立递归文件统计为准。

完整后端 140 项测试已包含 `cloudflare/test/console-assets.test.ts` 的 3 个行为测试，验证允许的页面深链、HEAD、缺失 JS、未知页面、非法编码及 API/learn 不回退到 console HTML。任务 13 的 `e2e/legacy.spec.ts` 同时已实际执行真实本地 Worker 的缺失 JS/未知 console 页面/API 404 及 HEAD account 200 空响应体行为，完整原生套件 32/32、exit 0。

## 功能对照

下表记录正式资源上 32 项套件实际通过的行为，最终证据为 `.nmai/tmp/console-date-full32.log`、`.nmai/tmp/console-task13-date-fix.md`、`.nmai/tmp/console-task13-report.md` 及 `console-web/e2e/{console,actions,history,layout,legacy,session-browser}.spec.ts`。原生最终进程 exit 0，任务 13 日期修复及整体最终审查均规格 PASS、质量 APPROVE。

质量审查曾发现固定日期夹具在七天后离开真实窗口（P2）。现以 Worker 相同的北京时间口径移动 exact childA、数学、固定标记及完整数值匹配的两行夹具，不累积每日数据、不新增 DELETE；真正 SQLite 测试覆盖跨北京时间午夜、多次准备、其他行不变及主键冲突明确失败。修后保留真实当前日 read=2/minutes=12、缺快照日 null/0 断言，并完成上述 3/12/32 项回归。未改系统或 Worker 时钟，未改变业务和正式资源，因此原 151 项前端、140 项后端及 bundle 产物证据仍适用。

历史证据保留：`.nmai/tmp/console-e2e-final32-native.log` 曾为 32/32、exit 0；更早 `.nmai/tmp/console-e2e-final32.log` 虽行为全过但 PowerShell 把 pnpm stderr banner 包装为 NativeCommandError，外壳 exit 1，不能当成功退出。日期修复后的最终结论仅采用 `console-date-full32.log`。

| 能力 | 最终验收状态 |
| --- | --- |
| 登录、注册、身份确认、恢复及退出 | 行为通过：真实注册 Parent，两个待确认账号分别提交 Parent/Student 身份；Chrome 原生 /me 与刷新会话、旧 logout 延迟后新 login 顺序正确 |
| 管理员概况、会员搜索/筛选/分页 | 行为通过：真实搜索、Student 筛选、22 条夹具分页与刷新保留 |
| 会员改密、改身份、绑定及解绑 | 行为通过：解绑后父 API 404、重绑 200，改密撤销旧会话及旧密码，改身份清关系、expectedRole 冲突 409 |
| 家长添加多个孩子、切换孩子与迟到响应隔离 | 行为通过：添加真实凭据并清密码草稿；仅延迟真实传输，旧孩子迟到响应不覆盖新选择 |
| 学习概况、有效时长、7/30/90 曲线及单元筛选 | 行为通过：四宽真实报告、曲线、学科/册次筛选；指标口径另有报告单元测试 |
| 匿名排名、反复错题及作答历史 | 行为通过；320/390 排名有真实内部横滚，修复后截图已查看，匿名标签与历史记录保留 |
| 手写原稿、照片答案及历次批改 | 行为通过：Canvas 非透明笔迹；两次照片各自有效 PNG（80px），红/蓝不同答案对应各自点评；旧 revision 笔迹限制如实说明 |
| 设备奖励、独立云账本、家长幂等确认 | 行为通过：四宽确认窗口明确孩子/9.00 元，320 确认及重复请求账本均仅一条，焦点留在 dialog |
| 精确学生上下文的拍照题库、试卷兼容入口 | 行为通过：Parent/Admin 1280/320 指定第二孩子，题库与普通试卷刷新不回落首孩子，返回 console/account |
| 管理员课堂试用隔离 | 行为通过：Parent 被拒；Admin preview 课堂不写指定学生记录 |
| 本机连接设置、语音、返回及共享音效 | 行为通过：真实设置 dialog 及输入、返回；账号 A/B 连接设置隔离，同设备音效共享，不调用真实模型或语音服务 |
| Android 桥接和原有学生流程 | 合成 Native bearer 桥接行为通过，Admin 留在旧课堂壳不跳 console；Student 回原壳。未进行真机/APK 验证 |
| 1280/768/390/320、键盘、输入标签、表格与确认窗口 | 行为通过：四宽页面无根溢出，真实 input accessible-name/Tab、孩子选择键盘、表格内部横滚、表单及确认焦点；实际查看截图 |
| 服务端拒绝越权、解绑后失权、会话撤销 | 行为通过：ParentB 管理 API 403、其他孩子原稿 404；非 mock 授权，真实 Worker/D1 |
| 页面深链回退、缺失资源 404、体积限制 | 构建/单元行为通过；真实 Worker HEAD/404 行为通过，完整原生套件 exit 0 |

## 本地预览与重启

当前本地预览：<http://127.0.0.1:8791/console/>。根代理已启动独立预览进程 session 38091，并在 **2026-11-05 14:26:40（UTC+08:00）** 实测 `/console/login` 返回 HTTP 200 且包含应用入口。证据：`.nmai/tmp/console-local-preview-health.json`、`.nmai/tmp/console-local-preview.log`。登录账号信息见 `growing/console-web/e2e/fixtures/local-users.ts`，不在对话或报告复制密码；此预览仅连接合成测试库。

服务停止后，可在项目根目录重启；8791 已占用时不要重复启动：

```powershell
pnpm.cmd --dir growing/console-web exec tsx e2e/fixtures/start-local.mts
```

脚本先检查 8791 未被占用，拒绝复用未知服务；随后只在 `.nmai/tmp/unified-console-db` 准备合成账号与隔离 D1，启动本地 Worker。启动成功后在浏览器打开 `http://127.0.0.1:8791/console/`，结束按 Ctrl+C。账号信息见 `growing/console-web/e2e/fixtures/local-users.ts`，不在对话或报告复制密码。该命令不部署、不访问生产 D1、不触发 custom build；前提是本次正式 public 资源已生成且本机依赖可用。

## 数据限制与发布状态

- 原稿接口提供当前笔迹及历史批改，没有每个旧 revision 的笔迹快照；页面须如实说明。照片历史按各次批改自身的 `answerPages` 展示。
- 成长快照缺日保持空值；有效时长无日记录采用服务端真实零值。设备奖励摘要与云账本独立，不相加。
- 本地合成账号和测试数据仅用于独立 Worker/D1。最终预览已单独启动并实测健康；它依赖本地进程运行，不是生产服务。进程停止后可按上面的命令重启。
- 未部署；生产可用性、真机 Android 及 APK 发布未验证。
