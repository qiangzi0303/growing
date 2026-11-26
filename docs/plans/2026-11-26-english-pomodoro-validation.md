# 英语全单元番茄：接入与验证

已将确认原型接入上册 Unit 1–8 的统一英语课堂，使用正式 Vue 组件、学习控制器和原账户存储。未填充尚待教材核对的下册内容。

## 已实现

- 学习标签下面显示横排番茄；运行入口只显示时间，点击查看只读记录。原词卡、默写、复习、语法和句子学习方式保留。
- 学习倒计时 20 分钟；新词轮要求完成 8 个完整掌握，未达到则继续超时；复习、语法等学习轮按时间结束。休息 5 分钟后显示下一个空的待开始番茄。
- 暂停最多 5 分钟，随后自动恢复；以绝对时间补算后台和刷新期间经过的时间。
- 原流程有效完成并保存成功后，记录单词掌握、独立复习、要点练习、整课检测、概念复述和句子闯关；失败、查看旧答案、修改草稿不算完成。复习不冒充新词。
- 原课程 key 中追加 `pomodoro`，保留旧成绩和未知字段；复用账户隔离及完整单元 ID。坏存档不覆盖，写入失败提供重试，重试不重复入账。

## 验证结果

- 71 项引擎、控制器、复习、默写、成绩测试通过；包含 8 个单元各自完成单词后正确入账、存储失败重试、账号失效、早恢复、跨阶段、旧草稿恢复和直达课程。
- 15 项句子、语法要点及课程关联测试通过。
- 9 项当前 Vue 组件测试通过，包含新番茄组件、原词卡/默写组件和错误界面。
- 最终控制器调整后重新验证 12/12 通过。
- Vite 正式构建通过。
- 真实浏览器通过 15 项检查：8 单元正式加载入口，原课堂 8 词完整学习（七次默写、适用的复数、词义词类验证），暂停 5 分钟恢复、20 分钟后休息、下一轮待开始且内容为空、刷新保留、手机无横向溢出和只读弹框。
- 浏览器使用隔离本地存档；口述评分返回受控响应，未声称验证真实在线 AI 服务。最终浏览器从项目 `app-design/` 读取同步后的正式文件，无资源替换。
- 本次 8 个网页资源及构建产物同步到权威源、项目网页根和 Cloudflare 本地资源目录，SHA-256 一致。未线上发布、未修改真实账户成绩、未提交 Git。

## 已知旧测试问题

额外运行的 `learning-ui/test/student-unit3-controller.test.js` 与 `student-unit3-component.test.js` 共 18 项失败。旧夹具按固定脚本下标读取历史独立 Unit 3 页面；该页面在本次任务前已加入跳转到统一课堂的脚本，使脚本下标失配，报 `Cannot set properties of undefined (setting 'wordFocus')`。

本次未恢复旧独立课堂或更改其测试夹具。当前统一 Unit 3 已在上述全单元控制器和正式浏览器检查中通过。

## 证据

- `.nmai/tmp/pomodoro-regression.log`
- `.nmai/tmp/pomodoro-linked-tests.log`
- `.nmai/tmp/pomodoro-components.log`（包含上述旧夹具失败）
- `.nmai/tmp/pomodoro-final-controller.log`
- `.nmai/tmp/pomodoro-build.log`
- `.nmai/tmp/pomodoro-production/result.json`
- `.nmai/tmp/pomodoro-production/sync.json`
- `.nmai/tmp/pomodoro-production/desktop-records.png`
- `.nmai/tmp/pomodoro-production/desktop-next.png`
- `.nmai/tmp/pomodoro-production/mobile-strip.png`
- `.nmai/tmp/pomodoro-production/mobile-records.png`

以上 `.nmai` 路径相对于项目根。
