# 数学动画交互实验室

数学上、下册 11 章均可从课堂顶部的“动画交互实验室”进入。第十章入口位于原有分式课堂顶部；返回按钮继续回到原课堂。实验室支持离线运行，不依赖 CDN。

三角形章节列表另有“三角形的四心”专题入口，整合用户提供的 `triangle-centers.html`：内心、外心、重心、垂心可分别显示或叠加，支持顶点拖拽和键盘滑块、欧拉线、中点三角形、播放/暂停、单步、速度、随机、重置及四种典型形状。专题返回按钮回到三角形实验室；小测不写入学习进度。样式和公式本地化，退化三角形会提示；等边三角形四心重合时不绘制方向不唯一的欧拉线。

| 章节 | 演示内容 | 数量 |
| --- | --- | --- |
| 三角形 | 三线、内外角、三边关系、全等变换、垂直平分线、角平分线、等腰与等边 | 7 |
| 实数的初步认识 | 平方根与数轴、立方根、近似值 | 3 |
| 勾股定理 | 正方形面积、逆定理、梯子模型 | 3 |
| 平面直角坐标系 | 坐标与象限、平移、轴对称 | 3 |
| 一次函数 | 斜率截距、交点与方程组、费用模型 | 3 |
| 数据的收集、整理与描述 | 样本偏差、频数频率与图表、统一单价 | 3 |
| 认识概率 | 等可能放回试验、必然与不可能、频率曲线 | 1 |
| 四边形 | 平行四边形、特殊四边形、中位线、梯形 | 4 |
| 因式分解 | 提公因式、平方差、完全平方 | 3 |
| 分式 | 定义域与零值、约分通分限制、加减、乘除、方程与增根 | 5 |
| 二次根式 | 定义域、绝对值、乘除、同类根式合并 | 4 |

共 39 个演示。每个演示包含参数滑块、可选择参数的播放/暂停、单步、速度、重置、随机条件、实时读数、结论和可收起的预测小测。播放只在点击后开始，切换实验、调整参数或页面不可见时暂停。

此外有 1 个四心专题，资源为 `app/src/main/assets/web/app-design/triangle-centers.html` 和 `triangle-centers.css`，同样定向同步根目录 `app-design`。四心几何与交互验证脚本为 `scripts/test-triangle-centers.py`。

实验不自动计入课程掌握、奖励和已读进度，也不修改原存档。随机条件用于探索；概率试验使用可复现的伪随机样本。所有教材知识点都有对应实验入口映射，一些相关知识点共用模型；模型用于观察与数值验证，不代替一般证明。

主要源码位于 `app/src/main/assets/web/app-design/math-explore-lab.html`、`math-lab.css`、`math-lab.js`、`math-lab-models.js`，网页预览副本同步到项目根目录的 `app-design`。定向同步这些文件，避免运行会覆盖其他已有课程改动的完整同步。

验证命令：

```text
node --test scripts/math-lab.test.cjs scripts/year8.test.cjs scripts/course-tools.test.cjs scripts/course-ai.test.cjs scripts/physics.test.cjs scripts/test-platform.cjs
python scripts/test-math-lab.py --output ../.nmai/tmp/math-lab
python scripts/build-worker-assets.py
python scripts/verify-assets.py
```

浏览器测试需要 Playwright 和 Chrome；`--chrome` 可指定浏览器路径。测试使用临时本地 HTTP 服务，覆盖 11 章入口、39 个实验操作、手机平板宽度、键盘操作、离线操作和减少动态效果偏好，输出截图与检查记录。发布流程已收录数学模型行为测试与资源缺失检查。
