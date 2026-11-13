# 首页 Vant 小范围样板

用户已同意先推进评估中建议的首页三杠菜单、设置表单、学习日历样板。本轮只迁移这三块，并以 `ui=vant` 参数启用，供真实账号入口与独立课程首页对照。普通页面保持现有入口；后台 Naive UI、课程正文、排名算法、原稿与设备权限不在本轮迁移范围。

## 架构

- 新建独立的 `learning-ui` Vue 3 + Vant 4 构建包，不改 `console-web`。Vite 生成本地 IIFE JS/CSS 到安卓课程资源 `app-design/vendor/learning-ui/`，同时同步项目源素材和 Worker 静态资源。库与图标完全本地打包，不依赖 CDN。
- `vant-home.js` 是旧页面与新组件的适配入口，仅在 `ui=vant` 时工作。独立首页替换原首页菜单；网页账号外壳仅在课程首页显示样板菜单，课程跳转、退出或身份变化时销毁并恢复旧入口；安卓仍由原菜单创建账号动作，样板委托原排行榜、设备设置与退出逻辑。
- Vue 独占新增挂载点。旧菜单仅隐藏，不被 Vue 修改；新菜单动作通过适配器调用旧业务入口，不让 `innerHTML` 与 Vue 共同管理一棵 DOM。
- 样式沿用“逆流”浅灰、白色和森林绿；三杠44px，手机弹层可滚动，桌面弹层限制宽度，显示真实状态与空记录。

## 业务契约

`GrowingVantHome.mount(target, adapter)` 返回 `{destroy(), close()}`。

适配器字段：

- `identity: string`；`actions: {rankings?, account?, device?, logout?, learningSettings?}`，各动作无参数，返回值可为 Promise。只有存在且有权限的动作才显示。
- `deepseek: {info(), save(values), clear(), test(signal)}`，复用 `GrowingCourseAI`；`voice: {info(), save(values), clear(), test(signal), voices}`，复用 `GrowingRealtime`。info 只包含脱敏配置；save 使用既有验证与存储。输入留空沿用旧密钥，保存/关闭后清除输入草稿；关闭中止连接测试并屏蔽迟到结果。
- `calendar: {units(): Promise<Array<{id,label}>>, read(unitId): Promise<{days,baseline,datedMastery}>}`。使用 `GrowingCurriculum` 的已核对单元及 `GrowingUnitCalendar.collect`。适配器读取已绑定当前账号的存储，不产生任何进度写入。日历展示已存摘要及首次达标累计，不补造历史日期。

组件使用 Button、Icon、Popup、Cell、CellGroup、Tabs、Tab、Form、Field、Picker、Calendar、Dialog、Loading。课程单元选择、月份切换、今日返回、保存、清除与测试均可操作，不使用静态模型代替交互。

## 安全与生命周期

每个挂载实例捕获当前账号存储代理；退出/换账号/离开首页销毁实例、清理草稿、终止请求。Vue 不接收已保存密钥。网页账号菜单动作沿用原权限，独立预览排行进入真实账号应用，不请求静态服务器假接口。资源加载失败保留旧菜单并明确显示重试信息。

## 验收

先写失败的组件与接入行为测试，再实现。验证真实 Vue/Vant 构建、旧业务回归、320/390/1440浏览器、已有记录只读、密钥保存/清除/草稿清理/迟到请求、学生/家长/未登录权限、账号切换清理、安卓桥接模拟和离线资源。安卓真机不可用时明确记录未验收，不宣称真机通过。保留当前所有无关未提交改动，不自动提交或发布。
