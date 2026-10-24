# 成长评测

入口在课程首页物理之后，作为第四张同尺寸课程卡片。桌面四列，601–960px 两列，手机一列。网页与 APK 共用 `app/src/main/assets/web/app-design/growth-assessment.html`。

参考站点：https://test.pansgo.com/?from=math-top 。当前使用原版人生四象限题库；其余三项通过原站深链接作答。原站明确返回 `X-Frame-Options: DENY` 和 `frame-ancestors 'none'`，不使用 iframe 或代理绕过。其他题库未找到复用授权，未复制到项目。

2026-10-24 核查用户提供的 `xiaoyang111222/cn-math-taxonomy`：`main` 分支的完整文件树与 README 均未找到成人情商题库。该仓库的 CC BY-NC 4.0 说明适用于其中的学科知识图谱、题库、诊断工具代码及文档，不能据此推定独立测评站全部内容的授权。成人情商仍由测评站提供37题原版作答，课程页面始终保留入口。

入口年龄为12岁、13–17岁、18岁及以上，默认12岁。儿童智商和情商链接只在选择12岁时开放。成人情商入口始终显示，供成年人或家长自评，年龄选择不会隐藏该入口。原站儿童版止于12岁，没有13–17岁专用题库。人生四象限保留事业等成人场景，未声称适配青少年或具备年龄常模。

| 评测 | 内容 | 结果 |
| --- | --- | --- |
| 儿童智商 | 原站9–12岁档20题、15分钟 | 原站提供，链接 `https://test.pansgo.com/?test=iq` |
| 儿童情商 | 原站家长问卷24题，可选孩子小故事题 | 原站提供，链接 `https://test.pansgo.com/?test=eq` |
| 成人情商 | 原站37题 | 原站提供，链接 `https://test.pansgo.com/?test=adult-eq` |
| 人生四象限 | 原版20题，心智、身体、精神、事业各5题 | 本地作答，原版等级、类型、建议与重点选择规则 |

人生四象限各选项使用原版1–3分，保留选项顺序，不能按选项序号计分。各象限5–8分为1.0、9–11分为2.0、12–15分为3.0。并列最低时按身体、心智、精神、事业选择重点。结果不是心理诊断。

新题库单独使用 `growing-original-quadrant-v1`，保留一个草稿和最近12次结果，遵循课程的账号存储隔离机制。存档损坏时保留原值，存储失败时明确告知并保留本页作答。旧版 `growing-assessment-v1` 只读，保留历史和草稿，旧结果仍按旧题库评分；`growth-assessment-core.js` 为此保留。原站答题的隐私及存储遵循原站说明，不同步到本课程。没有接入原站统计脚本或提交接口。

来源与许可：作者 xiaoyang111222 / Pansgo，仓库 https://github.com/xiaoyang111222/life-quadrant ，内容许可 CC BY-NC 4.0（仅限非商业复用，需署名）。页面提供原站、作者、许可和修改说明，完整许可保存为 `growth-quadrant-LICENSE.txt`。题目、选项、分数、结果文案及计分规则保持原版；界面和本机存储由本项目实现。

题库下载于2026-10-24，来源 https://test.pansgo.com/life-quadrant/content.json ，原始文件 SHA-256：`7d7425bae3742c5bb59ca0cb742c578dcbff2a9dfc2c173670c2069b1d000559`。`growth-quadrant-data.js` 仅将原始 JSON 包成浏览器变量，兼容离线 WebView。

旧版兼容规则测试：`node --test scripts/growth-assessment.test.cjs`。原版评分测试：`node --test scripts/growth-quadrant.test.cjs`。界面、原题逐项比对、断点续答和存储异常验证位于父项目 `.nmai/tmp/growth-assessment/`。
