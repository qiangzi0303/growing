# 后台拍照试卷处理 Agent

首版复用现有拍照试卷、个人题库、单元知识点和错题关联。APK/网页上传照片后查询进度；服务端队列独立执行识别、复核、题图生成、作答核对和入库，页面关闭不取消后台任务。

## 技能与模型职责

- 技能源：`cloudflare/skills/photo-exam-to-question-bank/skill.md`。
- 运行时策略：同目录 `policy.json`，版本 `1.0.0`，由后台 Agent 注入视觉模型系统提示。
- OCR：`POST https://open.bigmodel.cn/api/paas/v4/layout_parsing`，模型 `glm-ocr`，读取 `md_results`；后台配置 `ZHIPU_API_KEY`。
- 视觉模型：负责原图独立复核、受限 SVG 重绘及其视觉检查，以及学生实际作答判断。OCR 本身不会完成整套流程。
- 原始 OCR 响应保存在后台私有缓存；队列恢复复用成功结果。客户端进度响应、日志和导出试卷不包含密钥或原始模型载荷。

## 使用与恢复

1. 学生上传归属自己；家长上传选择已关联孩子。后端在创建、执行和写入前验证归属，不由模型决定权限。
2. 查看任务进度，完成后在“我的拍照试卷”查看电子题面。可信归类关联已有单元知识点；无法确定的题目保留待归类。
3. 数学题图使用 SVG，不用照片截图替代；生成或复核失败时保留原稿和阶段。用户修正题面后，关联与批改必须对应当前题目版本。
4. 确认错误或部分正确的实际个人作答关联错题。空白试卷、未作答、字迹不清和待复核结果不计作错误。
5. 失败时从当前阶段发起重试，不新建同一份试卷来绕过错误。重试用原任务标识，保留已成功 OCR、题目和历史作答。

首版数学题图使用电子矢量；英语、物理含图题暂标记待校对，不计为已完成的电子题图。题面存在疑点时保留电子草稿与原稿，将判定设为 `review`，不自动关联知识点或错题。用户编辑校正后沿用同一题目 ID 更新关联。图形内容改变会取消自动确认，并递增后台题目的内容版本，使旧判分只留作历史。

自动复核保存为 `AutoVerifiedRevision`，人工确认仍由 `Reviewed` 表示；两者不混用。原题、题库、错题库引用同一题目 ID，不复制三份内容。

## 上线前配置

本文件与 Skill 创建不代表服务已经上线。实际启用需完成以下事项，并以主实现的部署说明和验证结果为准：

- 应用本版数据库迁移，保留现有试卷、作答及账户数据。
- 创建并绑定后台处理队列，启用对应消费者及恢复机制。
- 配置后台 `ZHIPU_API_KEY` 和所需视觉模型凭据。密钥不进 Git、APK 或技能文件。
- 构建与部署后端及本版客户端资源；确认旧客户端任务仍可恢复。
- 用独立测试账户验证：上传后关闭客户端仍可完成，重试不重复入库，家长/学生归属正确，含图题为电子 SVG，未作答不误入错题库。

本版入口为 `cloudflare/src/worker.ts`；后台调度为 `src/photo-processing-agent.ts`，分阶段状态机为 `src/paper-import-jobs.ts`。

| 配置 | 本版值 |
| --- | --- |
| 数据库迁移 | `0022_photo_processing_agent.sql`，此前迁移须按顺序应用 |
| Queue 名称 | `growing-photo-processing` |
| Queue 绑定 | `PHOTO_PROCESSING_QUEUE` |
| 消费 | 单批 1 条，最多 2 个消费者，失败重投最多 5 次 |
| 恢复任务 | 每 5 分钟扫描无错误、未完成且租约到期的后台任务 |
| OCR 密钥 | `ZHIPU_API_KEY`，本地 `.dev.vars`，线上 Worker Secret |
| 视觉模型 | 现有后台 `paperFigure` 模型配置；未配置时读取 `PAPER_FIGURE_MODELS` / `HANDWRITING_VISION_MODELS` |
| 服务端渲染 | `@resvg/resvg-wasm` + 随包 Noto Sans SC 子集，缺失字形明确报错 |

新任务发现 Queue 绑定时启用 `photo-agent-v1`，未绑定时保留历史客户端流程；绑定了队列却缺少 GLM 密钥会明确拒绝新上传。入队发送失败时仍保留上传成功记录，由恢复任务补发。API `POST /api/question-bank/import-jobs/:id/retry` 需要授权学生和当前 revision；后台任务拒绝客户端 `/step`。

上线顺序：确认 Queue 可用并创建队列 → 应用迁移 → 配置 Worker Secrets 与视觉模型 → 部署 Worker/静态资源 → 使用专用测试账户做闭环验收。部署会同时启用 Cron。仅本地 `.dev.vars` 有密钥不会自动配置线上 Secret。当前没有执行创建线上 Queue、远程数据库迁移或生产部署。

## 验证边界

适配器协议测试和模拟队列测试只证明程序契约。真实模型识别质量、图形忠实度及线上运行须分别验收。交付时同时说明：本地测试结果、是否进行了真实模型验证，以及是否已部署。

### 2026-11-25 本地验证结果

- 全量后端回归：269 项通过；随后补充管理员权限用例，队列专项 6 项通过（含已有 5 项）。旧实时语音、知识点链接与公式转义的过时测试已按现有实现更新，并补充非法输入拒绝断言。
- 前端后台轮询专项：33 项通过；Vue 控制器 14 项、真实编译组件 2 项通过。
- TypeScript、Vue/后台静态资源生产构建、Wrangler dry-run 打包通过。WASM 渲染包含真实 workerd 测试，生成 PNG 像素与中文标签已验证。
- 真实浏览器：1440×1000 桌面、390×844 手机均通过；查看进度正常，关闭后停止客户端轮询，无 `/step` 或任务原图读取，无 JavaScript 错误或横向溢出。使用本地模拟 API，不是线上闭环。
- 真实模型小样：使用原卷第 22 题的原稿作为输入，在隔离 D1 执行 GLM-OCR、规划、定位、原图复核、SVG 重绘、服务端渲染、视觉核对、作答判断及入库。第一幅重绘被拒绝，自动第二次重绘通过；最终生成 1 题并判为 `unanswered`，未入错题库。已人工查看渲染图，内容为电子线条与文字。
- 小样首次知识点匹配为空，未强行关联；补齐复核 JSON 示例的 `practice` 字段后，单独真实复核返回同目录的 `math-8a-01 / isosceles`。这一补测与前一次完整流水线分别记录，不冒充整套试卷识别准确率测试。
- GLM Key 已配置在被根项目和应用 Git 忽略的本地 `cloudflare/.dev.vars`；项目 Skill 重载成功。未配置线上 Secret、未执行远程迁移或部署，未构建或发布新版 APK。

验证记录位于项目 `.nmai/tmp/`：`photo-agent-backend-final.log`、`photo-agent-queue-final.log`、`photo-agent-browser-results.json`、`photo-agent-live/`。浏览器截图为 `photo-agent-desktop-progress.png` 与 `photo-agent-mobile-progress.png`；真实模型题图预览为 `photo-agent-live/figure-0.png`。
