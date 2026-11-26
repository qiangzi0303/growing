# 英语全部单元：正式接入番茄记录

用户已批准多轮效果图并要求“落地所有英语单元”。覆盖当前已核对上册 Unit 1–8 的统一课堂；下册待核对，不生成虚构课程。不提交或发布。

## 确认的体验

- 原有单元目录、词卡、正式默写、复数和AI复述流程不变。标签下方增加横向番茄，运行时入口只有时间。
- 不预分任务。只有学习结果有效且保存成功后才记入本轮；查看/作答中/失败不记为完成。弹框仅显示时间、已学内容、结果与时长。
- 20分钟专注，5分钟休息；新词轮最低8个完整掌握，不足则超时继续。纯复习/其他学习轮按20分钟结束；不能把旧词复习算作新词。新词学习动作将当前轮设为新词轮。
- 暂停满5分钟自动续计，按绝对时间补算后台或刷新期间的经过时间。休息结束后显示下一轮待开始，内容为空，不自动启动。

## 存档与接入

- 在现有账户隔离的 `growing-english-course-v1:<unitId>` 中增加 `pomodoro`，沿用所有未知字段和旧成绩；不另造不受同步支持的存档key。
- 纯计时引擎负责不可变状态推进、完整校验、边界和去重；课堂控制器负责可信完成事件与原存档共同保存。
- 时间显示每秒刷新，存档仅在开始/暂停/恢复/阶段变化/完成结果时写入。失败显示原因，不伪造保存成功；重试不重复计数。多页面从最新存档读改写。
- 引擎 API：`restore(raw,unitId)`、`start(raw,unitId,at,{newWords:false})`、`pause(raw,unitId,at)`、`resume(raw,unitId,at)`、`advance(raw,unitId,at)`、`complete(raw,unitId,at,item)`。返回新状态；不做I/O。round：`id,index,phase,elapsedMs,restMs,lastAt,pauseUntil,goal,items`，phase=learning/break/finished，goal=0/8，pauseUntil=null或绝对毫秒。item：`id,kind,title,detail,newWord,at`（可附结果快照）。
- 控制器UI接口：`model.pomodoro={rounds,error}`；actions：`pomodoroStart,pomodoroPause,pomodoroResume,pomodoroRetry`。组件内管理弹框选中轮次，不改变课堂view。

## 实施与验证

1. 编写纯引擎边界测试，覆盖暂停5分钟、跨阶段、刷新、8词门槛、无预分配、重复完成、坏存档。
2. 独立 Vue 横排/只读弹框组件及交互测试；用原课堂组件插入确认位置。
3. 控制器接入保存链、账户生命周期、原成绩和失败恢复；记录单词及其他实际完成活动。
4. 执行针对性控制器/组件测试和 Vite 构建，真实浏览器验证8单元、手机、原课堂完整学词、存档恢复。
5. 仅同步相关文件与构建产物到三个本地网页根，并核对文件哈希。保留现有其他会话改动。
