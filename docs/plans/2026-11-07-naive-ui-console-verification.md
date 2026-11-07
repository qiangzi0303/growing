# 后台 Naive UI 迁移验收记录

日期：2026-11-07。用户已批准全部控件迁移并开始落地。

## 已完成

实际后台的学生、会员、报告、奖励、历史、排名、账号设置、亲子绑定、登录和共享概况控件已统一使用 Naive UI。表单、选择器、数据表、分页、确认弹窗、进度、折叠、音效开关及状态反馈直接使用官方组件，沿用现有主题。

原稿 canvas、照片批注和 ECharts 保留；API、权限、路由参数、服务端分页、异步隔离、密码清理与二次确认保持。历史和报告的零值、缺失值、金额和计分口径经过回归验证。隐藏的模板剪贴板 textarea 是内部实现，不属于可见业务控件。

## 验证结果

| 检查 | 结果 | 证据（相对项目根） |
| --- | --- | --- |
| 完整 Vitest | 21 文件、157 项通过 | `.nmai/tmp/naive-all-tests-final.log` |
| 排行榜键盘滚动修复后的历史回归 | 10 项通过 | `.nmai/tmp/naive-history-scroll-tests.log` |
| vue-tsc | 退出码 0 | `.nmai/tmp/naive-types-scroll.log` |
| 最终生产构建 | 退出码 0 | `.nmai/tmp/naive-build-responsive.log` |
| 最终浏览器验收 | 20 项通过（真实本地 Worker/D1、Chrome） | `.nmai/tmp/naive-e2e-final.log` |
| 规格及独立质量复核 | 通过，已处理全部重要发现 | 本会话原生子代理复核记录 |

浏览器覆盖 1280、768、390、320 像素下的管理员与家长页面、真实下拉和键盘选择、筛选与分页刷新恢复、角色确认弹窗、原稿画布、各批改版本图片、排行榜键盘横滚、奖励确认弹窗与焦点、音效开关、加载失败重试、空态、权限拒绝、切学生后旧响应隔离，以及延迟退出后的新会话恢复。奖励实际提交、防重复与绑定/密码清理同时由单元测试覆盖；本轮浏览器奖励操作仅预览与取消，不改变账本。

手机验收发现并修复 NDataTable 在网格中的默认最小宽度导致的内容溢出。最终限制组件外壳宽度，内部仍按 scroll-x 滚动；检查同时核对 html 和实际 main 内容区域，避免根页面隐藏溢出造成假通过。

人工查看了桌面会员表、320 像素会员表/账号/奖励弹窗/排行榜截图。最新示例：`.nmai/tmp/console-stage3-admin-320-members.png`、`.nmai/tmp/console-stage3-parent-320-rankings.png`、`.nmai/tmp/console-stage3-naive-parent-320-account.png`、`.nmai/tmp/console-stage3-naive-parent-320-dialog.png`。

## 交付边界

已将后台构建产物单独复制到本地 Worker 预览的 console 目录（53 文件）。未执行线上部署、APK 打包或 Git 提交。工作区原有英语试卷与网站入口修复等其他任务改动均保留。网站 `/` 与后台 `/console/` 的入口隔离逻辑未被本次迁移改动。
