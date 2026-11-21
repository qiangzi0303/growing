# Unit 1 单词学习与默写合并

> 已获用户确认：落实已讨论方案，以 Unit 1 全词表为例；词光没有对应或词义匹配的插画时生成。实现先写行为测试，保留已有改动，不提交、不部署。

## 目标与范围

- Unit 1 使用统一“单词学习”入口，词表、插画词卡、正式七次默写、今日复习在同一课堂中；其他单元保持现有功能。
- Unit 1 当前全部单词和短语逐条配图，保留教材词义与选学标记。优先使用词光同词同义插画，缺失或不匹配时通过 generate-image 生成，必须检查实际成图。保留词光署名及授权，生成图不得冒称词光原图。
- 词卡可看图、听发音、看例句与搭配；进入默写后隐藏插画与英文答案，提交后才展示反馈图。
- 现有七次连续默写、复数与词义词类验证、正式成绩和奖励规则保留。每日复习仅一次独立拼写，作为七次验证中的一次实际作答保存；未完成正式验证不凭复习结果宣称已正式达标。
- 正式默写与每日复习共同更新逐词复习时间：1/3/7/14/30 天。按本地日历日安排，同一天每词最多推进一次；答错或提示后次日再练，当天订正不升级；提前练对不推迟到期，提前练错缩短到次日。未到期词不进入默认今日复习。逾期只需复习一次。
- 今日复习优先必会到期词，已有正式达标但没有复习档案的必会词可先检查一次。选学词可主动练习，不强加默认必会任务。
- 错词当天延后至少若干其他词后重试（不足时结束首轮再重试），重试不修改首答计划；一次追加重试即可。
- 旧 wordPilot 档案保留，不把以前选择题成绩当作独立默写成绩。旧 practice=word-pilot 链接进入合并后的词表。
- 复习草稿、位置、提示、已提交反馈可刷新恢复。存储失败、外部冲突和账号切换不得覆盖别人的数据或丢掉当前答案；重试保存不得重复推进计划。

## 实现分工与接口

### 复习逻辑与课堂控制器（实现代理）

负责 `english-word-review.js`、`student-english-course.js` 及针对性 Node 测试。先测试日历边界、间隔、同日/提前/错误行为、旧成绩保护、刷新恢复、保存失败、冲突与账号失效，再实现。

独立 UMD 复习模块挂载 `GrowingEnglishWordReview`。附加数据保存于原 `growing-english-course-v1:english-8a-01` 档案的 `wordReview` 和 `wordReviewSession` 字段，沿用 read-modify-write 并保留其他字段。

提供给 UI 的模型约定（可在协作消息中明确补充，但不要静默改名）：

- `studyEnabled`、`studyCards`（word id 到 `{art,scene,example,translation,collocation,ipa,artSource,generated}` 的映射）。数据全局为 `GrowingEnglishWordStudyData={unitId,words:[{id,word,...}]}`。
- `reviewPlan={dueIds,freshIds,scheduledIds,nextDue}`，`reviewStatus[id]={label,due}`。
- `reviewSession`：`ids,index,draft,hinted,feedback,finished`；当前词沿用 `m.word`。feedback 至少含 correct、answer、hinted、retry；累计统计可另提供。
- `reviewUnsaved`、`reviewError` 供禁用和恢复提示；保存失败继续显示提交结果。
- 操作 `startReview()`、`startLearning()`、`startWordReview()`、`reviewInput(text)`、`submitReview()`、`reviewHint()`、`reviewNext()`、`retryReviewSave()`、`reloadReview()`。
- `navigate('words')`、`word(id)`、`recall()` 等现有操作继续有效。新复习界面 view 为 `review`。
- 正式默写提交后可通过模型字段提供本次复习提示，但必须保持现有调用与测试兼容。

### 单词插画与内容（素材代理）

负责 `english-word-study-data.js`、`word-study-scenes/`、来源文件及内容验证。检查 Unit 1 全部词条，复用已下载词光索引和 manifest，下载匹配图，生成缺图。使用项目配置的 generate-image helper，完整输出落 `.nmai/tmp`，禁止向终端打印原始响应/base64；不改 UI、controller、构建文件，不部署。

### 界面与资源接入（主代理）

创建 `learning-ui/src/StudentWordStudy.vue`，接入 `StudentEnglishCourse.vue`。继承现有绿色、白底、字体和按钮，不重设计全站。词表以清晰任务入口和简洁词条呈现，词卡突出插画；手机单列，默写期间隐藏答案。

接入新脚本、更新缓存版本、构建清单和三个本地资源镜像。旧试学链接兼容至合并入口。运行真实 Vite 构建与 Vue 行为测试。

### 评审与验收

独立审查规格、成绩/存储安全和实现质量，修正重要问题。真实浏览器覆盖桌面/手机、原七次默写、错词重试、提示、刷新、跨天到期、账号隔离与非 Unit 1 回归。真实生成服务与本地所有图片加载检查，检查词图匹配与来源署名。仅同步本地资源，不发布。

## 实施与验证结果

- Unit 1 全52词已合并至单词学习；38张词光原图、14张真实生成图，逐图来源及校验值见 `word-study-scenes/SOURCES.md`。
- 64项课程/复习/成绩/素材/页面适配测试、4项 Vue 组件测试通过，Vite生产构建通过。
- 真实浏览器在1280、390、320像素宽度检查52张图片加载、词卡、每日默写、草稿和反馈刷新恢复、正式七次及口述门禁；另验证到期3天间隔、保存失败重试、提示/订正不增加独立正确及Unit 2回归，均通过，无页面异常。
- 独立规格及质量评审发现的答案回看、直链提示、退出误降级及损坏存档问题均已修复并回归通过。日历边界、账号失效、外部冲突与异常存档由Node行为测试覆盖。
- AI插画使用真实生成服务；原有口述AI评分沿用现有接口，评分逻辑用受控响应验证，本次未另发在线口述评分请求。
- 61项资源在权威目录、根预览、Worker本地目录的SHA-256一致。仅本地构建及同步，未发布。
- 浏览器报告：项目 `.nmai/tmp/unit1-study-check/report.json`；插画验收：`.nmai/tmp/unit1-artwork-validation.json`。
