# Unit 1 十词学习试点

用户已确认上一轮调研提出的十词试点，直接实施。使用 superpowers 的小任务、先测试后实现与独立评审流程；不提交、不部署。

## 范围与体验

- Unit 1 必会词：friendship、honest、cheerful、truth、joke、humorous、caring、patient、laugh、unhappy。以现有教材词表再次核验；patient 使用形容词义。
- 英语 Unit 1 课堂加入“10词试学”，复用现有 Vue/Vant 页面、账户存储和内置单词音频。界面以现有绿色为强调色，白底、深色正文，内容场景图是主视觉。手机单列，电脑词图与内容并排；按钮至少 44px。
- 学习路径：今日概览 → 每组认识 5 词 → 打乱顺序回忆 → 错词隔几题换题型再练 → 本轮首答统计 → 现有句子闯关。
- 题型：看词选义、语境补句、听音辨词、看义拼写。提示或显示答案不算独立答对。原创新例句与图必须与教材词义一致。
- 保存学习中断点、草稿、首答、复习日期。试点采用明确的 1/3/7 天间隔，答错或使用提示后安排次日再练；不声称已接入 FSRS。之后可根据试点反馈接入 FSRS。
- 本轮重试不重复更新统计、复习间隔；未到期的额外练习不提前刷高记忆状态。正式七次默写、口述、课程成绩与奖励继续沿用原规则。
- 数据放入现有 `growing-english-course-v1:english-8a-01` 的 `wordPilot` 字段，使用原账号和同步通道。保存时保留其他字段；遇损坏档案、账号变化或其他页面已改动试点数据，停止覆盖并显示恢复办法。

## 文件与分工

1. 内容与场景（实现子代理）
   - 新建 `app/src/main/assets/web/app-design/english-word-pilot-data.js`，UMD 导出 `GrowingWordPilotData`，对象 `{version:1,unitId:'english-8a-01',words:[...]}`。
   - 每词字段：`id,word,pos,meaning,ipa,scene,example,translation,collocation,tip,cloze,reviewCloze,art`。`cloze/reviewCloze` 单个 `___`，只需原形目标词；`art` 为 `word-pilot-scenes/<id>.svg`。
   - 10 幅本地原创 SVG 场景图，无外部引用、不包含英文答案。
   - `scripts/english-word-pilot-data.test.cjs` 核实十词必会、语境唯一、图存在。
2. 排题与复习（实现子代理）
   - 新建 `english-word-pilot-core.js`，UMD 导出 `GrowingWordPilotCore`。
   - `empty()`、`restore(raw,words)`、`plan(state,words,now)`、`begin(state,words,now,{practice:false})`、`answer(state,words,value,now)`、`next(state,now)`、`setDraft(state,text)`、`hint(state)`、`summary(session)`，不可变返回状态。
   - `state={version:1,cards:{},session:null}`；`session={id,mode,steps,index,answers,feedback,draft,hinted,finishedAt}`；step `{wordId,kind,options?,retry?}`，kind 为 intro/meaning/cloze/listen/spell；options 为词 ID 数组，提交统一用目标词英文；answers 以 wordId 为键保存首答 `{correct,hinted,kind,at}`。
   - `plan` 返回 `{due:[id],fresh:[id],nextDue:number|null}`；`summary` 返回 `{total,correct,hinted,wrong:[id]}`，correct 只统计首答且未提示的独立正确。
   - card `{due,streak,reviews,lastAt}`；intervals 1/3/7 天。feedback `{correct,answer,wordId}`；next 清空当前草稿、提示、反馈；intro 可 next，答题必须已反馈。
   - 排题前五个 intro 后接打乱的这五词回忆，再下一组；先到期复习。首答一次更新 cards，最多两次错词重试。额外 practice 只保存本轮，不更新 cards。
   - `scripts/english-word-pilot-core.test.cjs` 覆盖错题、重试、恢复、到期、提示、跨天与重复提交。
3. 控制器、UI 和入口（主代理）
   - 新建 `student-word-pilot.js`、`learning-ui/src/StudentWordPilot.vue`；读取上述数据与纯逻辑，保护存储、账户、音频生命周期和移动端输入。
   - 最小修改 `StudentEnglishCourse.vue`、`student-english-course.js`、`english-engine.js`、`english-course.html`、构建资源清单。保留这些文件的已有其他改动。
   - 添加控制器行为测试与 Vue 实际编译；浏览器检查实际课堂入口、完成全轮、刷新恢复、手机布局、失败保存与正式成绩隔离。
4. 独立规格、代码质量与内容评审；修正重要问题。

## 验证与交付

- Node 执行新的 data/core/controller 测试及既有英语 controller、engine、score 测试。
- Vite 构建实际 Vue 源码；定向同步受影响资源与 bundle 至当前本地 Web/Android 资源目录；不运行旧版 `sync-web.py`。
- Playwright 使用隔离存储，在 390px/320px/桌面完成真实流程。截图与报告保存项目 `.nmai/tmp/`。
- 不发送生产数据，不调用付费 AI，不宣称已有跨天真实学习效果。
