# 英语动画记单词

参考项目根目录 `英语动画` 中两张图片的词汇主题，重新绘制为 SVG 教学场景，不使用截图中的界面或位图。共 17 个空间关系表达和 16 种行走、奔跑表达，配中英文含义、例句和易混区别。

英语上、下册目录顶部均有“动画记单词”按钮，进入 `english-visual-lab.html`；返回按钮保留学期。动画可播放/暂停、单步、调整速度和拖动进度。词汇列表可直接选词，也可前后切换。看动作选词练习可折叠，独立播放；探索不写入单元学习进度或奖励。发音使用设备英语语音，可用性取决于设备。

所有图形在本地用 SVG 路径绘制，页面不依赖 CDN；原始图片不参与运行。`english-visual-atlas.svg` 提供可下载的静态矢量词汇图谱。`scripts/build-english-visual-atlas.cjs` 从相同模型重新生成图谱，Worker 资源构建也会自动调用它。

行走动画由 `english-motion.js` 的关节步态模型绘制：以膝、踝、肘分段运动，区分支撑与摆动阶段；固定镜头，滚动地面标线显示速度。拖脚几乎不离地，齐步走高抬膝，跛行左右不对称，踮脚保持脚跟抬起，蹦跳有同脚跳跃与换脚，跑步有双脚腾空。默认开启同步对照，可选参考词或关闭对照；手机窄屏上下排列，使用相同时间与绘图比例。

角色参考 [Ian Xiaohei Illustrations](https://github.com/helloianneo/ian-xiaohei-illustrations) 的小黑规范：不规则黑色实心轮廓、白点眼睛、细胳膊与细腿、空表情。教学动画以新绘制的可动 SVG 表现，动作场景采用白底、黑线，少量橙色路径、蓝色提示和红色落脚标记。示例 PNG 仅用于风格校准，不作为运行资源。作者 Ian 的署名和完整 MIT 授权保存在 `english-motion-NOTICE.txt`，页面底部可查看。

主要资源位于 `app/src/main/assets/web/app-design/english-visual-*`、`english-motion.js` 和 `english-motion-NOTICE.txt`，定向同步到项目根目录 `app-design`。不要使用完整 sync-web 覆盖其他课程改动。

验证：`node --test scripts/english-motion.test.cjs scripts/english-visual.test.cjs scripts/english.test.cjs scripts/course-tools.test.cjs`；浏览器运行 `scripts/test-english-visual.py --output <目录>`，可用 `--base http://127.0.0.1:8790 --login-stdin` 测试真实登录课堂。`scripts/test-english-motion.py --output <目录>` 渲染 64 张关键帧、48 帧动作动画，并检查同步对照开关和参考动作选择。
