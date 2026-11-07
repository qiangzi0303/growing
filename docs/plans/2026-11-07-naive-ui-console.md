# Naive UI 后台实施计划

依据已批准的 2026-11-07-naive-ui-console-design.md。使用 Superpowers 分模块实施与复核；用户已经授权开始落地，无须再次确认。

## 1. 学生与会员

文件：views/students/index.vue、views/members/{index,[id]}.vue、features/students/components/student-picker.vue、features/members/components/*。

先补失败交互测试，再迁移表单、下拉、表格、分页与详情组件。保留查询恢复、权限、取消请求与身份冲突处理。运行 student-pages、student-selection、member-pages、member-actions 测试。

## 2. 报告与奖励

文件：views/{reports,rewards}/index.vue、features/{reports,rewards}/components/*。

先补失败测试，再迁移 NDataTable、NPagination、NSelect、NProgress、NCollapse 和反馈组件。保留表格内容、北京时区、金额和评分口径、独立异步状态及奖励确认。运行 report-pages、family-rewards 测试（family-rewards 由整合阶段统筹）。

## 3. 历史与排名

文件：features/history/components/*。

先补失败测试，再迁移选择器、表格、分页、折叠与反馈。保留原稿/画布、批注定位、作业版本选择、排名详情和请求隔离。运行 history-pages 测试。

## 4. 账号与绑定及整合

文件：views/account/index.vue、features/family/bind-child.vue、必要业务状态组件、共享测试环境。

补音效/表单行为测试后替换控件，统一 NForm、NSwitch、NButton、NAlert。检查所有可见业务控件，清理已失效的控件样式。使用真实组件测试，按需补 jsdom 的 ResizeObserver 等浏览器能力。

## 5. 验证与复核

执行 vue-tsc、全量 Vitest、生产 build；仅 stage console 到现有本地 Worker。运行管理员/家长浏览器测试及桌面/手机交互和截图检查。每模块进行规格复核再质量复核，解决重要问题后做整体复核。记录实际通过项与限制，不将源码字符串断言当行为验证。不得覆盖其他任务改动，不自动提交或发布。

## 完成情况

以上五项均已完成。规格与独立代码质量复核通过；最终 157 项单测、20 项真实浏览器测试、类型检查和生产构建通过。详细范围与证据见同目录 `2026-11-07-naive-ui-console-verification.md`。仅更新本地代码与预览产物，未提交或部署。
