# 拍照试卷与 AI 本地缓存验收记录

2026-11-18：本地实现完成；独立规格复审通过，独立质量复审 APPROVE。未提交、部署或打包发布 APK。

## 已实现

- 拍照上传默认整理并批改。有效个人错题进入对应单元；可靠知识点关联支持跨单元引用，题目与历史不复制。
- 数学、英语、物理支持本卷及学科累计诊断，区分考查知识点和薄弱证据，显示具体错因及最近待复核状态，可返回原题。
- 单元目录以红点提示待订正错题；订正正确后消除提醒，保留历史。未批改和共享教学样例不自动视为个人错误。
- IndexedDB 缓存试卷详情（含原始照片）、题图、批改记录、列表、摘要和诊断。普通查询有效期 5 分钟，Native 课程查询 60 秒，AI 成功结果 1 天；最多 80 条、约 24 MB，存储不可用时回退内存和在线请求。
- 缓存按访问账号、学生与服务地址隔离。家长或管理员复用缓存前实时检查关联权限。任务进度不缓存。
- 批改和修改自动失效缓存；手动刷新同时刷新试卷和题图；AI 面板支持重新生成。题面或题图版本变化后旧批改不复用，服务端保存时校验版本。
- 旧请求不能覆盖强制刷新后的结果；切换账号后的迟到 401 不会注销新账号；失败和取消不当作成功结果。
- Web、项目预览、APK 静态资源与 Worker 静态资源已同步；构建脚本包含新增缓存文件及资源版本更新。

## 验证

日志路径均相对于项目根目录 `D:\成长\初二英语`。

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| 缓存、诊断控制器、账号竞态、旧 AI 面板 | 24/24 | `.nmai/tmp/paper-final-controller-tests.log` |
| 学习 UI 全套测试，含实际 Vue 编译组件 | 136/136 | `.nmai/tmp/paper-final-ui-tests.log` |
| Worker API、导入、原卷批改、三学科与图谱回归 | 115/115 | `.nmai/tmp/paper-final-api-tests.log` |
| TypeScript 检查 | 通过 | `.nmai/tmp/paper-final-tsc.log` |
| Vue 构建 | 通过 | `.nmai/tmp/paper-final-build.log` |
| 真实浏览器 IndexedDB、刷新复用、修改失效、权限撤销、学生隔离、Native 桥接 | 10 项通过 | `.nmai/tmp/paper-cache-browser-result.json` |
| 实际编译 Vue 手机/桌面：错因显示、诊断筛选、返回原题、红点消除、错题入口 | 通过，无页面错误 | `.nmai/tmp/paper-ui-browser-result.json` |
| 资源副本 SHA-256 比对 | 50 文件一致 | `.nmai/tmp/paper-assets-result.json` |
| Git diff 空白检查 | 通过 | `.nmai/tmp/paper-diff-check.log` |

界面截图：`.nmai/tmp/paper-diagnosis-mobile.png`、`.nmai/tmp/paper-catalog-mobile.png`、`.nmai/tmp/paper-catalog-desktop.png`。

## 验证边界

浏览器和 API 测试使用隔离夹具及模拟 AI 响应，未上传真实学生试卷、调用付费模型、写入生产数据或进行安卓真机测试。Native 缓存桥接已在浏览器模拟 Native 环境验证，不能替代真机验收。

缓存不提供跨设备或跨标签页即时推送失效；外部变更通过有效期、回到目录刷新或手动刷新获取。正式成绩仍以服务端记录为准。上线后才能使用本次新增 API 与界面功能。
