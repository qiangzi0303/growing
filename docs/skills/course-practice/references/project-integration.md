# 项目接入说明

以下路径相对于项目根 `D:\成长\初二英语`。这是当前实现的导航，编辑前仍需核实文件和调用关系；新学科或专用页需要适配，不能假定已有通用模块自动支持。

## 权威源码与静态资源

- 课程权威源码：`growing/app/src/main/assets/web/app-design/`。
- 对应静态资源：`growing/cloudflare/public/learn/app-design/`。按当前构建规则同步受影响文件，检查输出和源文件一致；同步静态文件不等于发布。
- 项目根 `app-design/` 是旧版来源；不要运行 `growing/scripts/sync-web.py` 用旧版覆盖当前源码。使用构建脚本前先读其当前行为，避免连带生成或删除无关产物。

## 当前共用微课

- 数学课程数据：`math-upper.js`、`math-lower.js`、`math-data.js`；物理入口数据为 `physics-data.js`。新增课程同时检查 `curriculum.js` 与页面的实际数据依赖。
- 页面为 `math-course.html` / `physics-course.html`，共用 `math-course.js`。分式现有专用页、英语及未来学科不能只加题库后声称已接入；应先确认真实入口并做相应适配。
- `practice-math-upper.js`、`practice-math-lower.js`、`practice-physics.js` 按真实知识点ID提供每节点7道补充题；`application-practice.js` 与原节点的3道基础 `practice` 合并为10题。不是向补充数组再填10题。
- 补充数组顺序：3基础选择、2提高选择、1难解答、1综合解答。选择题字段为 `prompt/options/answer/explanation`，`answer` 为0–3的整数；解答题为 `type:'solution'` 加 `prompt/answer/explanation`，答案为字符串。
- 共用模块赋予 `${nodeId}-application-${i+1}` 的ID、`topic`、`level` 与 `type`。既有ID和题目语义应保持稳定；实质换题时处理原稿与历史成绩版本，不能让旧批改误算为新题成绩。

## 原稿及成绩

- `handwriting-core.js` 的 `knowledgeUnits` / `knowledgeNodes` / `units()` 等映射须包含新单元和节点，才能正确生成解答任务和校验原稿；核对目录、题库、手写映射及后端规则是否一致。
- `application-practice.js` 的 `tasks/link/results/score` 负责本题任务、跳转、原稿结果关联和计分。当前原稿匹配还依赖精确题干，因此新增解答题须检查单元内题干唯一性。
- `handwriting.html` / `handwriting.js` 接收 `subject/unit/practice/task/id`，更新原稿地址后仍需保留 `practice`。`handwriting-ai.js` 复用 `/api/handwriting/ai` 发送真实页图与题干、`nodeIds`。
- 选择草稿保存到 `practiceChoices`，十题最好成绩为 `practice10:{version:1,total:10,best:0..10}`。`practice-progress.js` 统一区分新十题与旧 `bestQuiz` 三题成绩。
- 成绩消费者包括 `unit-summary-core.js`、`cloudflare/src/reports.ts`、`rankings.ts`、`unit-reports.ts`、`student-knowledge.ts`。新增学科或节点时检查相应生成规则与目录，不只修改展示文案。

## 验证入口

- 题库、路由、计分、原稿修订与旧档：`growing/scripts/application-practice.test.cjs`。新增学科时扩展其覆盖范围；当前只覆盖已接入的通用微课。
- 课程及工作台：`year8.test.cjs`、`physics.test.cjs`、`unit-summary.test.cjs`、`course-tools.test.cjs`、`handwriting.test.cjs`、`handwriting-direct.test.cjs`，均位于 `growing/scripts/`，按改动选择。
- 后端报告兼容：`growing/cloudflare/test/application-practice.test.ts` 与 `unit-reports.test.ts`；修改后端时运行项目现有 TypeScript 检查。
- 浏览器使用隔离测试存储，避免写入真实学生原稿；需要验证网络失败或有效评分时可模拟批改API，检查实际请求仍携带本题图像和知识点。只打印题目ID、状态等摘要，不输出照片的Base64。
