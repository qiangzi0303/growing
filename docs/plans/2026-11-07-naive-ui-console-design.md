# 后台统一 Naive UI 设计

用户于 2026-11-07 确认：所有控件都用 Naive UI，开始落地。

范围为 console-web 的实际后台业务页面及共享组件，沿用 Soybean Admin、NConfigProvider、现有主题与中文 locale。输入、下拉、按钮、表单、表格、分页、折叠和反馈直接使用官方组件，不额外建立通用封装层。

- 表单使用 NForm/NFormItem/NInput/NSelect，音效开关使用 NSwitch。
- 数据表使用 NDataTable，远程分页使用 NPagination，保留字段、链接、金额/时间/零值口径。
- 原生 details 使用 NCollapse，进度使用 NProgress，状态使用 NAlert/NSpin/NEmpty。
- 原稿 canvas、批注、ECharts 及必要布局保留，它们是专业内容。
- 保留 API、路由查询恢复、请求取消/序列隔离、身份权限、密码清理、绑定/解绑/核销确认和防重复提交。
- 宽表由组件横向滚动；桌面和手机均应可操作。
- 网站 / 与后台 /console/ 入口隔离不变。此次不发布、不打包、不自动提交，保留工作区其他任务改动。

验收：组件真实行为测试、完整单元测试、vue-tsc、生产构建、桌面与手机浏览器检查，以及规格和质量复核。
