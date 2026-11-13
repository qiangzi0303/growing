# 保留原样式，使用 Vant 控件：验收记录

2026-11-12。已按用户要求恢复原页面的布局、配色、字号、卡片、分栏和工具栏外观；按钮、表单、选择器、弹层等继续使用真实 Vue 3 / Vant 4 控件。后台保留 Naive UI。未提交、未发布。

视觉基准为安卓课程素材中同页 `?ui=legacy` 的实际浏览器效果，包括原有 `learning-ui.css` 的最终级联；没有另做视觉设计，也不宣称像素逐点一致。

## 已恢复的外观

- 首页：原品牌位置、三学科图标、白卡尺寸与手机排版。
- 目录及总结：连续章节列表、原学期开关与资源入口、单容器分组及知识点标签。
- 课程：原目录侧栏、章节标题、进度区、米色词卡、教材图和手写编辑区。
- 实验与图谱：原观察区和参数栏、深色实验框架、知识图谱及三角形四心布局。
- 试卷：原白纸版心、题型分区、检测卷选项、错题卡片、拍照试卷和逐题工作台。
- 学生外壳：原菜单、设置、日历及登录表单的尺寸和排版。账号继续显示 username，关闭入口使用 X／×。

沿用现有题目 ID、账号隔离、成绩与评分规则、照片和笔迹原稿以及历史记录。控件通过 controller actions 调用业务，没有隐藏旧按钮再转发点击。

## 本次验证

| 检查 | 结果 | 证据（项目根目录下） |
| --- | --- | --- |
| Vue 界面与控制器回归 | 107/107 通过 | `.nmai/tmp/style-final-ui-tests.log` |
| 最后修改的原卷、检测卷和陪伴控件 | 16/16 针对回归通过，与上述测试有重叠 | `.nmai/tmp/style-final-targeted-tests.log` |
| 页面生命周期及业务模型 | 48/48 通过，包含新增的旧类名可见性与 defer 加载时序回归 | `.nmai/tmp/style-final-model-tests.log` |
| 最终生产构建 | 通过，JS 496.17 KB / CSS 430.73 KB，未 gzip | `.nmai/tmp/style-final-production-build.log` |
| 最终生产包的 27 个学习入口 | 390 / 1440 两宽度共 54 场景通过；无回退、JS 异常或页面横向溢出，真实 Vant 节点存在 | `.nmai/tmp/style-production/result.json`，同目录代表截图 |
| 真实平台外壳 | 1440 / 390 菜单、设置、试卷列表、详情、题库及逐题工作台通过；复用已登录状态，题目 API 使用 fixture | `.nmai/tmp/style-production-platform/new-report.json`，同目录截图 |
| 独立视觉及实现复核 | 10 个课程／实验入口 × 两宽度通过 | `.nmai/tmp/style-final-review.md`、`style-final-review/result.json` |
| 原卷、图谱、检测卷、错题对照 | 两宽度共 16 张新旧截图；原卷作答弹层打开及 X 关闭通过 | `.nmai/tmp/midterm-style-check/result.json`，同目录截图 |
| 安卓素材／Worker／源适配器／公开外壳资源 | 123 项内容一致性检查通过 | `.nmai/tmp/student-artifacts-20261112.json` |
| 构建脚本保留页面内联逻辑 | 51 个 HTML 的内联脚本签名构建前后相同 | `.nmai/tmp/style-inline-stage-result.json` |
| Git 空白／冲突标记 | 通过 | `.nmai/tmp/style-final-diff-check.log` |

平台验证使用实际发布目录中的本地产物；最终 54 场景没有用私有 bundle 拦截替换。缓存版本已更新为 `studentUi=20261112-vant-style-4`，并同步到课程、安卓素材、Worker 和平台资源。

## 同时修复的迁移问题

1. 页面加载器会按旧类名误隐藏新 Vue 内部节点，现只隐藏 Vue 根节点外的旧页面。
2. 前置 defer 加载器曾在后续数学数据脚本前启动，造成间歇白屏，现等待 DOMContentLoaded。独立复核复现并在修复后通过完整重跑。
3. 缓存脚本曾把页面内联 JavaScript 的动态 href 当作 HTML 属性修改，现仅更新 script／link 标签资源；已修复动态返回链接，并验证构建保留内联脚本。
4. 陪伴小鸭启动按钮清除 Vant 默认白色边框及背景，恢复透明外观，保留原拖动和双击动作。

## 验证边界

浏览器覆盖本地页面和 fixture 业务流程；安卓真机、真实麦克风、在线 AI 调用与生成质量尚未验证。本次没有发布，也没有生成新的已验收 APK。
