# 数学分幕推导：两个课堂样板

两个样板嵌入原知识点的“图文讲解”，采用 Vue/SVG 网页动画。

| 知识点 | 本地试用入口 | 四幕 |
| --- | --- | --- |
| 平方差公式 | http://127.0.0.1:8797/app-design/math-course.html?chapter=math-8b-09&node=factor-difference | 看正方形→拿走小正方形→两块平移／旋转→读出长宽 |
| 勾股定理 | http://127.0.0.1:8797/app-design/math-course.html?chapter=math-8a-03&node=pythagoras | 确认直角→围出斜边正方形→平移同样四块→比较剩余面积 |

支持逐幕跳转、播放／暂停、进度定位、重播、参数调整、重置和图示放大。默认不自动播放；换知识点或离开图文讲解会销毁动画帧。调参时暂停并重新计算当前画面，不修改课程掌握、练习或复述记录。

## 紧贴本节的概念与定义

动画前常显“先理解概念与定义”，按原教程的知识点范围整理：

- 平方差：因式分解的定义、平方差公式的文字表述、数与整式的整体代入、两个平方项之差、先提公因式，以及公式一般范围与剪拼 `a>b>0` 条件的区别。
- 勾股：直角三角形、直角边和斜边的定义、定理的完整表述、三个平方对应的面积、确认直角和斜边、求边长取正平方根，以及定理与逆定理的区别。
- 两点都显示公式、符号说明、适用条件、蓝色易考点、橙色易错点，再过渡到分幕推导。核心定义与定理也进入开场语音和同步字幕。
- 内容依据现有课程 `math-lower.js` 的 `factor-concept`／`factor`／`factor-difference` 和 `math-upper.js` 的 `pythagoras`／`pyth-converse` 节点整理，不标作教材逐字引文；原例题、复述与十题练习继续保留。

## 中文配音与字幕

- 两个样板各配一段内置中文合成语音（云希，语速 -5%）：补入概念后，平方差约 76 秒，勾股定理约 86 秒；各四幕、八段字幕。点击“播放推导”才开始发声。
- 音频时间驱动画面与字幕，缓冲时不抢跑。暂停、续播、跳幕、拖动进度和重播同步处理；关闭“语音讲解”后保留字幕和原来的无声动画节奏。
- 切换知识点／学习页签、页面进入后台时暂停。卸载释放音频和 Blob；与已有小鸭讲课使用相同的音频互斥事件。加载失败时给出重试和关闭语音的选择。
- 当前两段 MP3 合计约 947 KiB，通过现有构建同步到 APK 资源、根预览和 Worker 静态目录。完整下载后以 Blob 播放，支持没有 HTTP Range 的本地预览及静态宿主，不依赖设备的中文 TTS。
- `math-proof-narration.json` 保存字幕和自然口述稿，`scripts/build-math-proof-audio.py` 生成 MP3、真实语音词边界对齐的字幕时间和 `math-proof-audio.json`；`math-proof-playback.js` 处理时间映射与播放生命周期。生成脚本使用 edge-tts / mutagen，运行时只播放已打包文件。

## 数学依据

- 平方差：先取 `a>b>0`。L形分为尺寸 `a×(a−b)` 和 `(a−b)×b` 的两块。第二块旋转90°后，与第一块拼成长 `a+b`、宽 `a−b` 的长方形。移动中保持边长和面积；一般实数范围的恒等式以展开说明补充。
- 勾股定理：四个全等直角三角形，每块面积 `ab/2`。第一种摆法围住边长 `c` 的正方形；两锐角和为90°保证中央四角为直角。第二种摆法留下边长 `a`、`b` 的两个正方形。外框都为边长 `a+b` 的正方形，所以剩余面积相等。
- 推导进度是讲解节奏，不是测量时间。动态数字用于示例；证明依据是全等、刚性移动与面积关系。

## 代码与来源

- `learning-ui/src/MathProofStory.vue`：两个舞台、分幕和交互。
- `learning-ui/src/math-proof-model.js`：可按任意进度重新计算的几何模型。
- `learning-ui/src/StudentMathCourse.vue`：按原知识点 ID 挂载，仅替换这两点的静态插图位置；原讲解、例题、复述、应用练习保留。
- `student-pages.js` 与 `scripts/build-learning-ui.mjs`：数学入口缓存版本及现有资源同步。

借鉴 Math-To-Manim 的镜头组织和符号讲解方法，具体来源见 [前期核查](2026-11-28-math-to-manim-review.md)。剪拼坐标、交互与证明场景为本项目实现；本次未运行 Manim 或生成视频。

## 验证

- `node --test test/math-proof.test.js test/student-math-component.test.js`，在 `growing/learning-ui` 运行：验证边长和面积守恒、参数边界、最终铺砌、中央直角及课堂原交互。
- 真实生产构建：`node growing/scripts/build-learning-ui.mjs`。
- 本地实际课堂浏览器验收：`.nmai/tmp/check-math-proof.py`，使用独立浏览器存储。逐一检查两点四幕、参数上下限、暂停、回看、重播、重置、切换知识点，以及复述草稿和练习选项保留。
- 截图检查覆盖1440px桌面及390/320px手机；图示可放大并在面板内横向滚动，说明和面积读数独立显示。结果与截图：`.nmai/tmp/math-proof/`。
- 语音新增验证：`node --test test/math-proof-playback.test.js test/math-proof.test.js test/student-math-component.test.js` 共 11 项通过，包含字幕边界、时间往返、资源 SHA-256、异步取消、缓冲、错误重试、无声模式及音频释放。
- 真实浏览器：`.nmai/tmp/check-math-proof-audio.py` 验证两个 MP3 实际解码播放、全部 16 段字幕／8 幕、暂停续播、跳幕定位、重播、开关、互斥、切页清理与草稿保留，以及真实音频请求失败后恢复播放。截图和结果保存在 `.nmai/tmp/math-proof-audio/`，已查看桌面及 390/320px 手机截图。
- 验证边界：已验证媒体播放状态、解码、时间同步与口述稿内容；未进行人工听感评价，也未在 Android 真机安装或 iOS Safari 上测试。

本地试用版，未发布线上。此次范围不含其他数学知识点、Manim视频、AI评分服务或真实账户云同步的验证。
