# 英语学习接入位置

项目目录 `D:\成长\初二英语`；代码仓库 `growing`。先核对当前代码，本文件用于定位，不代替现有实现。

## 源码与单元

- 网页权威源：`growing/app/src/main/assets/web/`。
- Unit 1、2、4–8：`app-design/english-course.html`，控制器 `student-english-course.js`；词表 `english-vocabulary.js`，阅读语法 `english-lessons.js`。现上册这些列表按编号组织；新增册次须扩展为完整单元ID或显式册次映射，不能把同编号上册内容当下册。
- Unit 3：保留 `word-ops-unit3/index.html`，控制器 `app-design/student-unit3-course.js`；原62词ID为 `w1`—`w62`，词表及课程内容内嵌在原页面。不要只把目录入口改到共享课堂，那里没有 Unit 3 的原课程数据。
- Vue：`growing/learning-ui/src/StudentEnglishCourse.vue`、`StudentUnit3Course.vue`；复用 `StudentWordStudy.vue`、`StudentWordFormal.vue`、`StudentWordArtwork.vue`。
- 间隔引擎：`app-design/english-word-review.js`。掌握判定：`word-mastery-rules.js`；课程积分与句子闯关见 `english-engine.js`、`english-score.js`、`english-sentence-progress.js`。
- 素材：`app-design/word-study-scenes/`；来源记录在该目录及单元子目录的 `SOURCES.md`。

## 词卡数据与加载

`english-word-study-data.js` 保留 Unit 1 的 `{unitId,words}`。其他单元文件为 `english-word-study-units-245.js`、`english-word-study-units-3678.js`；注册到 `GrowingEnglishWordStudyData.units[fullUnitId]={words:[...]}`。每张卡形如：

```js
{
  id: '稳定词条ID', word: '教材拼写',
  art: 'word-study-scenes/unit2/example.webp',
  scene: '简洁且与画面相符的中文图注',
  example: 'A meaningful example sentence.', translation: '对应的准确译文。',
  collocation: '常见搭配及含义', ipa: '可靠音标（可选）',
  artSource: '原图链接' // 真实生成图使用 generated:true，不能冒称词光原图
}
```

先加载基础词卡数据，再加载单元注册文件；`student-pages.js` 的英语课堂和 Unit 3 分支负责加载。增加文件时更新加载器和 `growing/scripts/build-learning-ui.mjs` 的资源清单。Unit 3 在较深的目录，图片相对URL须相对 `app-design` 正确解析。

## 存档和调用契约

- 共享课堂key：`growing-english-course-v1:<fullUnitId>`。`words[id].practice` 保存正式练习；`wordReview`、`wordReviewSession` 保存复习；`activeWordRecall` 恢复正式默写。
- 共享正式输入先调用 `recallInput(text)`，再无参数 `submitRecall()`；提交从模型草稿消费答案，不把已经处理的参数再提交一次。
- Unit 3 key：`wordops_8A_unit3`。保留 `mastered`、`wordRuns`、知识点、题目、历史及其他扩展字段。目录、总结、日历都依赖这个key，不擅自迁移。旧 `wordRuns.answers` 可能有错误，不能直接全算连续正确。
- Unit 3 专名 Italian 原流程要求大写I，保留其真实判定。句子成绩另有按完整单元ID隔离的存档。

## 本地构建和同步

从 `growing/learning-ui` 工作目录运行 `node node_modules/vite/bin/vite.js build`。产物是 `dist/learning-ui.js` 和 `dist/learning-ui.css`。

三个本地网页目录：

1. `growing/app/src/main/assets/web/`
2. 项目根（包含 `app-design/` 和 `word-ops-unit3/`）
3. `growing/cloudflare/public/learn/`

定向同步本次修改的源码、词卡数据、图片和 `app-design/vendor/learning-ui/` 两个产物。更新英语及 Unit 3 入口、动态加载器的资源版本。存在其他会话改动时勿全量覆盖或自动提交、发布。

相关测试入口：`growing/scripts/student-english-course.test.cjs`、`english-word-review.test.cjs`、`english-word-study-data.test.cjs`、`word-mastery.test.cjs`、`english-score.test.cjs`；Vue目录的 `test/student-word-study-component.test.js`、`student-unit3-controller.test.js`、`student-unit3-component.test.js`。按当前文件核对新增测试，不机械依赖此清单。
