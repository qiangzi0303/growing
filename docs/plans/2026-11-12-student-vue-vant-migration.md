# 学生端 Vue + Vant 逐页迁移

用户已确定：学生端逐页迁移 Vue 3 + Vant 4，后台保留 Naive UI。沿用现有配色、登录账号展示和 X 关闭规则。不自动提交或发布。

用户补充要求：完整保留原页面样式，仅替换实际控件。已恢复原布局和视觉并完成最终生产包验收，最新结果见 [原样式恢复验收记录](2026-11-12-vant-original-style-verification.md)。下列分批状态保留迁移过程记录。

## 页面边界与顺序

1. 学习入口：首页 `index.html`、目录 `units.html`、单元跳转／待开放页 `study.html`、总结 `unit-summary.html`。
2. 三科课堂：`math-course.html`、`physics-course.html`、`english-course.html`，及链接到的旧词汇／分式课堂。
3. 知识图谱和诊断：`knowledge.html`、`physics-knowledge.html`。
4. 资源与作答：三科 resources、`math-exam-practice.html`、`math-wrong-questions.html`、`handwriting.html`、原卷与题图页面、学生共享拍照试卷模块。
5. 实验与交互教学：英语动画／检测／例句、数学实验／模型、物理实验／声音实验。

按页面记录验收状态，未迁移页面不能标记完成。学习引擎、题目 ID、旧成绩、原稿、AI 评分接口保持原契约；交互控件换成真实 Vue/Vant 组件，不使用全局换标签或隐藏按钮转发事件代替迁移。

## 首批实现

- 独立 `learning-ui` 扩展页面组件；保留现有 `GrowingVantHome.mount`，新增 `mountStudent`，Vue 独占新增页面根节点。
- 学习入口四页默认用新版；`ui=legacy` 可回退。新资源失败时原页面可继续使用；后台不加载或使用学生页面组件。
- 首页保留品牌与真实三科入口；目录使用 Vant Tabs／Cell／Tag，复用课程目录和既有只读掌握度规则；总结使用既有 `GrowingUnitSummary` 引擎和真实账号存储。
- `study.html` 的已开放单元保持真实目的地跳转，未开放单元由 Vue 显示原课程说明；不新增虚构课程。
- 新 loader 管理加载、销毁、刷新与错误；原渲染器在新版成功后退出，不与 Vue 写入同一 DOM。
- 精确同步源素材、安卓课程素材和 Worker 素材，避免旧资源整目录覆盖。

## 验证

先验证行为测试失败，再实现并通过。运行生产 Vue 构建、对应业务回归、320／390／1440 Chrome、真实学生账号、已有成绩只读、待开放和无效路由、资源失败回退、菜单与返回。每批做规格及质量审查。真机未测时单独列明，浏览器模拟不能替代真机。

## 状态

- 首页菜单／密钥表单／学习日历样板：已验收。
- 首批四页：首页、目录、待开放／路由页、单元总结已完成浏览器验收与独立审查。
- 第二批九页：三科课堂、三科资源、两科知识图谱、手写已完成生产构建与 320／390／1440 Chrome；真实账号日历、返回及拍照入口通过。数学坏 topic 禁止覆盖、英语超时迟到评分拒写、bfcache 原稿 ID 恢复均有回归。
- 第三批七页：英语动画／检测／例句、检测卷／错题、数学实验／几何模型已通过共享入口三尺寸验收。数学订正已接共享 Vue 工作台，使用服务端真实题目 ID，不再跳转旧工作台。
- 第四批七页：独立分式课堂、三角形四心、两页物理实验室、Unit3 词汇课堂、期中原卷及考点图已通过三尺寸及资源失败回退验收。
- 学生外壳：登录、注册、身份选择、导航菜单、排行榜已换真实 Vant 组件；默认入口、公开匿名资源、账号隔离及 bfcache 恢复已验证。
- 共享拍照模块：试卷列表／详情、题库、逐题工作台、AI 解答及题图编辑已接 Vue/Vant；真实平台三尺寸主流程与宿主离开保护通过。保存失败或忙碌时，返回、Esc 和切换入口保留原稿；手机端旧 CSS 冲突已修复。
- 陪伴工具：已换真实 Vant 控件，旧原生控件节点被移除，业务回调直接调用；保留 WebGL 和语音引擎。设置、档案筛选、笔记、3D 调色／旋转及 X 关闭通过实际浏览器验收。
- 收尾：源素材 14 个代表页面无脚本错误／缺失资源／手机横溢；缓存统一 `studentUi=20261112-vant-3`，包含陪伴 bootstrap 的动态引擎导入；最终生产构建、107 项界面测试、46 项模型测试、123 项资源一致性及 diff 检查通过。
- 范围边界：当前课程入口覆盖的 27 个学习页面和上述共享模块完成；没有当前目录链接的两份历史分式离线入口保留原格式，不计入完成数。
- 后台 Naive UI 保留；未提交或发布。安卓真机尚未验证，桥接模拟不能替代真机。

## 当前验证证据

- `.nmai/tmp/student-vue-20261112/report.json`：首批入口 8 组浏览器场景。
- `.nmai/tmp/student-wave2-20261112/report.json`：第二批三种宽度、真实学生外壳、四类资源失败回退共 5 组。
- `.nmai/tmp/student-wave2-business.log`：35 项业务回归通过。
- `.nmai/tmp/student-calendar-error-green.log`：10 项页面生命周期／局部失败回归通过。
- 第三批共享入口：`.nmai/tmp/student-wave3-20261112/report.json`。
- 第四批共享入口：`.nmai/tmp/student-wave4-20261112/report.json`。
- 默认学生外壳：`.nmai/tmp/student-shell-20261112/report.json`。
- 共享工作台独立验收：`.nmai/tmp/paper-pages-preview/report.json`、`.nmai/tmp/photo-review-preview/report.json`、`.nmai/tmp/math-resources-preview/report.json`。
- 最新局部回归：`.nmai/tmp/student-final-shell-paper-tests.log`，37 项通过。
- 最终验收与限制：[2026-11-12-student-vue-vant-verification.md](2026-11-12-student-vue-vant-verification.md)。
