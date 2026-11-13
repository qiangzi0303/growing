# 学生端 Vue + Vant 迁移验收记录

后续已按用户要求完成“保留原样式，使用 Vant 控件”的修正。最新验证、生产资源版本与桌面／手机截图见 [原样式恢复验收记录](2026-11-12-vant-original-style-verification.md)。下文保留初次迁移阶段的验证记录。

2026-11-12。当前课程入口覆盖的 27 个学习页面，以及学生账号外壳、共享拍照试卷／题库／逐题工作台和陪伴控件已迁移。后台继续使用 Naive UI。未提交、未发布。

## 覆盖范围

| 范围 | 页面或功能 | 状态 |
| --- | --- | --- |
| 学习入口 4 页 | 首页、单元目录、路由／待开放页、单元总结 | Vue/Vant，三尺寸验收通过 |
| 课堂和作答 9 页 | 三科课堂、三科资源、数学／物理图谱、手写 | Vue/Vant，三尺寸验收通过 |
| 教学交互 7 页 | 英语动画／检测／例句、数学检测卷／错题、数学实验／几何模型 | Vue/Vant，三尺寸验收通过 |
| 补充课程 7 页 | 物理探索／声音实验、三角形四心、分式一分钟课、Unit3 词汇、期中原卷／考点图 | Vue/Vant，三尺寸及资源失败回退通过 |
| 学生外壳 | 登录、注册、身份选择、菜单、排行榜、密钥设置与学习日历 | 默认真实账号入口已验收 |
| 共享试卷 | 列表／详情、筛选、分类、导入恢复、题库、AI 解答／批改、题图核对与逐题订正 | 真实外壳动态加载及三尺寸主流程通过；题目 API 使用拦截 fixture |
| 陪伴工具 | 档案、笔记、设置、选择器、按钮、3D 调色与旋转 | 真实 Vant 控件、桌面／手机截图及统一生产包交互通过 |

保留现有题目 ID、题目修订版本、成绩接口、账号隔离、照片和手写原稿、批改历史。账号显示 username；关闭按钮使用 X／× 并保留可访问名称。只读数学排版、题面和 SVG 延用原渲染器，交互控件由 Vue/Vant 实现。

陪伴控件通过显式状态适配连接原有音频和 WebGL 引擎。旧原生控件节点被替换移除，Vant 直接调用业务回调，没有隐藏旧按钮再触发点击的转发方式。

当前目录实际链接的是分式一分钟学习版。`fraction-ops/index.html` 和历史离线手机版没有当前课程入口链接，保留原自包含格式，不计入迁移页面数。

## 最终检查

| 检查 | 结果 | 证据（项目根目录下） |
| --- | --- | --- |
| 界面与控制器回归 | 107/107 通过 | `.nmai/tmp/student-final-learning-ui-tests.log` |
| 页面生命周期／业务模型 | 46/46 通过 | `.nmai/tmp/student-final-model-tests.log` |
| Vue 生产构建 | 通过；JS 474.51 KB，CSS 305.59 KB，未 gzip | `.nmai/tmp/student-final-production-build.log` |
| 安卓素材／Worker／源适配器／公开外壳资源 | 123 项内容一致性检查通过 | `.nmai/tmp/student-artifacts-20261112.json` |
| 补充缓存版本同步 | 通过，包含 companion bootstrap 动态导入 | `.nmai/tmp/student-final-cache-stage.log` |
| Git 空白／冲突标记检查 | 通过 | `.nmai/tmp/student-final-diff-check.log` |
| 独立代码与规格复核 | 无新增阻断项 | `.nmai/tmp/student-source-quality-summary.md` |

脚本与样式缓存统一为 `studentUi=20261112-vant-3`。匿名外壳的 Vue 资源位于公开目录；登录后课程资源继续使用原鉴权路径。没有运行全量旧素材同步脚本。

## 浏览器证据

- 课程与学习页面：320／390／1440 宽度，分批报告为 `.nmai/tmp/student-vue-20261112/report.json`、`student-wave2-20261112/report.json`、`student-wave3-20261112/report.json`、`student-wave4-20261112/report.json`。
- 默认真实学生外壳：`.nmai/tmp/student-shell-20261112/report.json`，覆盖登录、菜单、排行榜、设置和匿名资源失败回退。
- 真实平台试卷：`.nmai/tmp/paper-real-shell/final-report.json`。CSS 修复后三尺寸主流程通过，包括动态加载、独立 AI 面板、题图、分类、笔迹与追问草稿。保存失败／忙碌时返回、courseBack、openPapers 和 openQuestionBank 均保留原稿，正常 Esc 可离开。
- 试卷资源故障：controller、AI controller 和共享 bundle 三种故障已在独立一轮验证明确错误及返回入口。之后合并重跑未完成登录前置，原因未确认；没有把该次尝试计为通过，也未重复登录。CSS 修复的三尺寸主流程与此前资源故障证据分别保留。
- 源素材：`.nmai/tmp/source-student-quality/report.json`，390 宽度实测 14 个代表页面，无回退、脚本错误、404 或横向溢出；仅补齐必需依赖，没有覆盖课程内嵌数据。
- 陪伴独立交互：`.nmai/tmp/duck-vant-qa/result.json`；最终统一生产包复验：`.nmai/tmp/duck-vant-shared-final/result.json`。覆盖设置、3D 调色／旋转、档案筛选、笔记 API 和 X 关闭，并验证实际请求带版本的课堂引擎模块。

手机端试卷曾受旧 grid 样式影响挤成窄列，已通过 scoped 样式修正并检查实际截图。陪伴工具也修复了旧样式误伤 Vant 内部文字、代理节点传入 ResizeObserver、输入焦点和页面卸载后的异步更新。

## 尚未验证

安卓真机、真实麦克风、在线 Qwen／其他真实 AI 服务调用及生成质量尚未验证。浏览器中的安卓桥接模拟和 fixture 回归不能替代这些检查；本次没有发布或生成新的已验收 APK。
