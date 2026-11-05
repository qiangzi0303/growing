# 英语句子打字 Demo

> 本文记录最初Unit2界面的实现与验证。后续已扩展到八上8单元、35知识点350句；当前入口与覆盖范围见 [各单元句子闯关](2026-11-05-sentence-units.md)。

按用户要求，对照 https://julebu.co/ 公开首页可交互练习面板实现界面和操作。当前课程仍使用 Unit 2 的10句原创练习（6基础、2提高、1难题、1综合），不扩展为参考站的营销页、账号或付费模式。

## 最终交互

- 预览整句：音标、单词中文、词性和主语/谓语/宾语/状语分组；按任意可打印键、Enter或点击提示开始。
- 看中文逐词输入，最后输入整句；空格或Enter提交。整句内部空格照常输入，完整后空格提交。输入法组合期间不提交。
- 顶部显示当前句子的题号：8个单词加整句即1/9至9/9。进度条按已离开的题推进，与原站实际状态一致；答对当前题仍停在原位置，下一句重置为0。
- 词宽下划线、紫色输入、红色拼写错误、橙色积分；去掉原来的大绿色确认按钮和长帮助文案。
- 底部为“播放发音／提交／显示答案”，答对后为“播放发音／下一题／重答”。显示答案可隐藏，仍须输入提交；重答保留原积分、连击和独立完成统计。
- 每题首答正确1000分，错误后订正300分，看答案0分；积分累计到本轮结束。首答正确增加连击，错误或看答案中断连击。每个题目只计分一次。
- 手机也保留答对状态供查看解析，点击下一题继续。同一个原生textarea保持在DOM中，处理软键盘只有input事件的空格。

## 实现范围

权威文件位于 `app/src/main/assets/web/app-design/`：`english-sentence-demo.html/css/js`、`english-sentence-data.js`。无新增框架或账号接口，不写localStorage，不影响正式掌握度、课程成绩和奖励。刷新重开本轮。

字体为本地 Inter Variable，来自 https://rsms.me/inter/font-files/InterVariable.woff2；SIL Open Font License 保存在 `sentence-inter-license.txt`。保留项目自身的品牌和返回 Unit 2 路径。

本地静态文件选择性同步到 `cloudflare/public/learn/app-design/`。不运行 `sync-web.py`（其输入不是权威源码），不发布线上、不提交Git。

## 已完成验证

- Node规则测试7项及原英语1291项数据、掌握度检查通过；新增单词音标/词性/分组完整性断言。
- `scripts/test-sentence-reference.py` 验证句内题数、进度重置、3按钮切换、显示/隐藏答案、重答不重复计分和统计保护。
- `scripts/test-english-sentence-demo.py` 完成桌面和390px触摸环境各10句、100题。桌面混合错误/看答案为96600分、独立7/10；手机独立100000分、连击100。
- 真实键盘输入、退格订正、IME、移动端input空格、同一编辑器及焦点、原存档保护、课堂入口/返回、朗读失败和过期回调均通过，pageErrors为空。
- 发现并修复手机长句解析挤压下一题按钮的问题；复核修复了单词重答与整句重答的统计不一致。
- 已查看1440/768/390预览与输入、错误、答对、整句和结果截图。Inspector将原站重阴影作为用户指定样式例外；紫色提示对比度和词性小字保留为两项已知告警，详见视觉复核记录。

证据：项目根 `.nmai/tmp/sentence-demo-preview/v3/result.json`、`reference-regression.log`、`node-tests.log`、`v3-inspect/report.json`。参考图位于 `.nmai/tmp/julebu-research/exact-reference/`。

验证边界：未在实体手机测试软键盘，未真人试听英语朗读；未接入实时小鸭、个人错题或自动复习。

本地体验：http://127.0.0.1:8796/app-design/english-sentence-demo.html?v=3
