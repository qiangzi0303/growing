# 几何思路引导试点实施计划

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement.

**Goal:** 在垂直平分线、角平分线、HL 全等各第 9、10 题加入逐级提示、关键步骤原因与图文联动。

**Architecture:** 保留题库 ID、题干、原稿和评分规则。独立的 `geometry-guidance.js` 用 ID 与完整题干双重匹配六份审核讲解；Vue 小组件只管理展示，不写成绩。当前实际课堂已迁移到 Vue，应在 `StudentMathCourse.vue` 接入，兼容旧课堂入口。

**Tech Stack:** 原生 JavaScript、SVG、Vue 3、Vite、Node test、Playwright。

用户已确认方案并授权实施；不再重新审批设计，不提交 Git，不部署。

## 1. 专属内容与几何图
- 新增 `app/src/main/assets/web/app-design/geometry-guidance.js`，CommonJS / 浏览器双入口，导出 `get(question)`。
- 只匹配 `cong-hl`、`perp-bisector`、`angle-bisector` 的 application-9/10；题干变化返回 null，避免把旧讲解用于新题。
- 返回 `{id, svg, hints:[{text,svg}], steps:[{title,text,why:{goal,noticed,reason},svg}]}`。三个提示逐层展开；图中辅助线仅在对应阶段出现，关键边/角/三角形突出显示。初始图不含推导结论。
- `scripts/geometry-guidance.test.cjs` 先测试六题覆盖、题干变更拒绝、非试点拒绝、无题库变更、辅助线阶段与几何关系，再实现。
- 验证：`node --test growing/scripts/geometry-guidance.test.cjs`。

## 2. 展示和现有课堂集成
- 新增 `learning-ui/src/StudentGeometryGuidance.vue`，提示每次只增加一层；“看解题思路”默认收起，打开后逐步切换。“为什么这样想”在当前步骤旁默认收起。回到自己想时隐藏全部推导。
- 图形紧凑，提供放大；文字与图同步。状态按题隔离，父级计时刷新不重置展开状态。
- `student-math-course.js` 快照加入匹配的 guidance；`StudentMathCourse.vue` 用专属图替换试点原静态图，复用既有上传、批改记录和统一提交。
- 新组件 jsdom 行为测试先红后绿，覆盖提示顺序、收起、步骤原因、切题、无成绩操作。
- 旧课堂通过同一份数据提供折叠讲解，不改变评分与原稿。

## 3. 验证与资源同步
- 运行组件/课堂控制器、应用练习及手写相关测试，Vite 实际构建。
- 桌面、390px、320px 检查六题提示/讲解、图形与无横向溢出；验证上传保存、模拟批改失败/重试、原稿及评分独立。
- 使用 use-browser 技能和已有浏览器；模拟 AI 只验证流程，不宣称真实批改质量。
- 定向同步新增/修改资源到 `cloudflare/public/learn/app-design/`，更新缓存版本并核对 hash。禁止运行 `sync-web.py`。
- 独立审查数学条件、需求与代码质量，修复后复验。最终说明入口、验证与尚未上线。
