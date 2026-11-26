# 英语要点动画推广

沿用用户已确认的 Unit 5 交互，覆盖已录入的上册 Unit 1–8；未核对的下册不生成内容。一个要点 TAB 配一个规则、例句、易错提醒、对应动画和十题（6 基础、2 提高、1 难题、1 综合）。保持原考核和成绩协议；成功保存静默，失败可重试。

## 实现任务

1. 通用注册器 `grammar-scenes/course-registry.js`：`GrowingEnglishPointCourses.define(unitId, {lessons})`；`get(unitId)` 返回 `{lessons,practice}`。完整单元 ID 隔离。Unit 5 原文件、题号和记录兼容。
2. Unit 1、2、4 内容在 `unit1-content.js`、`unit2-content.js`、`unit4-content.js`；Unit 6–8 同理。每文件调用 define；lesson ID 使用现有教材数据 ID。每 lesson `{tab,points:[...]}`。
3. point schema：`{id,title,rule,pitfall,sentence,translation,explain,animation:{kind,actors,labels,values?},rows}`。所有文本为纯文本（不插入 HTML）。`rows` 为 10 项 `[题干, '正确项|干扰项|干扰项', 解析]`。注册器产生带 unit/lesson/point 的稳定题号，轮换选项；不冒称真题。
4. animation.kind 可用 compare（人物高低比较）、quantity（数量柱）、sequence（顺序节点）、action（人物按步骤执行）、choice（两个分支）、transform（词形变化）、weather（天气变化）、reflexive（动作回到自己）。actors 为最多两个简短角色名；labels 为三个简短分镜标签，values 可为三个数字。每点拥有独立 scene，8 秒、关键帧 4.6 秒、播放 0–6.1 秒；最后平滑回到初态。文字/图示与内容对应。
5. 通用页面 `english-point-scenes.html?unit=<完整ID>&lesson=<ID>` 和原 Unit 5 页共用播放/练习逻辑。父组件新增 unit 属性（默认 Unit 5），桥接统一 `GrowingEnglishPointStudy.connect({read,write})`，保留旧别名。
6. 共享 controller 按 unit 取 practice，沿用 pointPractice[lesson][point]、乐观冲突检查。按用户后续明确要求，Unit 3 使用共享课堂，重新整理教材数据和考核，不导入原独立单词/题目/成绩；目录、总结、报告、奖励、排行同步统一。旧链接转向共享入口。
7. 技能入口与 reference 增加默认动画机制、真实数据 schema、兼容规则与验收；重载技能。

## 验证

先写注册/隔离/计分测试，再实现；运行受影响 controller 与组件测试、Vite 构建。浏览器覆盖 8 单元手机/桌面、TAB、动画帧、题目和解析、失败恢复；抽查内容与动画截图。定向同步三根，核对哈希，不提交或发布。

## 已完成验收

- 8单元35课86要点860道原创易错题；其中新增68要点680题，Unit5原180题兼容。
- 共享注册/数据/存档/旧Unit5/Unit3目录总结测试通过；共享controller与语法回归50项通过，Vue构建和受影响组件测试通过。
- 手机390和电脑1280逐课逐要点浏览器检查通过；保存恢复、失败重试、减少动态效果、旧链接跳转与原综合检测均验证。
- 新增68场景各采样6个时间点，画布变化和运行无异常；8类分镜及非人物对象图示已实际查看截图。
- Unit3服务端28项相关测试、TypeScript检查及隔离API缓存重算测试通过。使用隔离数据，未写真实账户或发布线上。
