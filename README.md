# 成长 · Android

首页有数学、英语、物理三张卡片。数学苏科版全年11章可学习，包含原分式课程及其余10章图文微课；英语已接入2025秋译林版八上8个单元，Unit 3沿用原课堂，其余7个单元新增388个词条、30节阅读与语法微课、90道原创检测题。物理开放上册5章、40个知识点、120道应用题及5章交互实验室，下册继续暂停。英语下册待教材核对。课程 HTML、分式音频、图谱、样式与题库随 APK 离线打包。

数学支持知识图谱、全景图谱和先修薄弱点诊断。分式导航增加“我有疑问”，可解答其他单元、其他学科或一般问题；当前单元资料只在相关时作为背景参考。各单元奖励默认120分钟游戏和200元红包，按正式掌握比例累计；60%对应72分钟和120元。页面显示进度条以及已获得、已核销、可核销额度，分次核销只领取新增差额。课程重置保留历史奖励与核销，旧版已锁定奖励按原约定承接。

## 下载与安装

到 [网站下载页](https://growing-platform.qiangzi0303.workers.dev/download.html) 下载最新 `growing-*.apk`；[GitHub Releases](https://github.com/qiangzi0303/growing/releases) 同时存档。Android 8.0 及以上可安装，需要允许来源应用安装 APK。音频、课程与练习可离线使用；AI 评分与答疑需联网。

APK 保留**本机账号**：首次使用注册用户名与密码，密码采用随机盐与 PBKDF2-HMAC-SHA256 哈希，不保存明文。退出后可重新登录同机账号；不同账号的课程记录分开保存。在“账号 → 云同步 / 家长关联”可自愿关联独立的学生云账号，跨设备同步并供家长查看；本机账号不会自动转换成云账号。

手机与 Android Pad 共用同一个 APK，适用于 Android 8.0 及以上并配有新版系统 WebView 的设备。支持横屏、竖屏和可调整大小的分屏窗口；旋转和窗口调整保留当前课堂、未提交输入及本机账号。登录表单在大屏居中限宽，账号与朗读设置支持滚动。iPad 使用网页版，不能安装 Android APK。

AI 接口不内嵌共享密钥。登录后点击原生栏的“账号”，配置自己的 DeepSeek API Key；仅保存在该账号的本机私有设置内。没有密钥仍能学习、播放音频和做题，无法请求真实 AI 评分或答疑。

三科在 APK 中共用当前账号的 DeepSeek 连接，不请求电脑端 NumaAI；原分式与英语 Unit 3 也使用相同连接。普通英语单元新增答疑入口。数学与物理提供教材与专项、学习日历、答疑、本章重置及逐级返回入口。课程名称旁“查看掌握程度”打开奖励弹窗。奖励独立使用 `growing-unit-rewards-v1:<单元ID>`，仍由原有账号隔离存储桥保存。

新英语课堂按教材词表区分315个必会词条与73个标星选学词条。必会词条连续7次闭卷默写正确、每节检测3/3正确才分别计1项掌握；标星词不强制默写、不计奖励分母。学习记录使用 `growing-english-course-v1:<单元ID>`，保留原Unit 3存档键。新课堂中的讲解、例句和检测可离线使用，听读使用设备语音。

## 手机朗读

APK 通过 Android 原生 `TextToSpeech` 朗读单词、例句及数学的设备朗读，不依赖 WebView 对 Web Speech 的支持。点击“账号 → 朗读设置 / 英语试读”可以测试并打开系统语音设置。手机须安装可用的 TTS 引擎和英语语音数据；数学设备朗读需要中文数据，内置音频不受此要求影响。离线朗读取决于引擎是否支持并已下载离线数据。数学设备朗读暂停后继续会从当前小段开头重读。后台切换、离开课程和退出账号会停止设备朗读。

## 固定签名与更新保留

正式安装版每次冷启动或从后台重新打开时，会在后台读取你自己 HTTPS 站点的 `update.json`；30 秒内的短暂切换不重复请求。发现更高 Android `versionCode` 后提示“下载更新 / 稍后”和更新说明，不影响登录和离线学习。未联网或服务限流时自动检查不弹错误；可在登录页或“账号 → 检查更新”手动重试并查看结果。开发版不提示正式版更新。

点击“下载更新”使用手机浏览器从 Cloudflare 站点下载 APK，下载后打开文件，允许浏览器安装应用并按 Android 系统提示覆盖安装。当前实现不静默安装，也不在后台自动下载。公开下载不需要登录或访问密钥，更新检查不上传本机账号、AI 密钥和学习记录。已有 1.0.6 需先手动覆盖安装含此功能的版本，之后才能自动检查。

更新地址已在 [update-site.json](update-site.json) 配置为 `https://007yx.com/downloads/update.json`。GitHub 正式构建固定使用此文件；自定义本地构建仍可用环境变量 `GROWING_UPDATE_URL` 覆盖。只接受相同 HTTPS 站点（含端口）的 APK 链接，`apkUrl` 支持相对路径。旧版覆盖升级后切换到新域名，旧域名继续为未升级设备提供更新。GitHub 构建后自动将 APK 与清单发布到 Cloudflare，无需手机访问 GitHub。完整配置见 [自有站点更新说明](docs/self-hosted-updates.md)。

- 固定包名：`com.qiangzi0303.growing`。Debug 使用 `.debug` 后缀，与发布版分开。
- 每次主分支提交触发 GitHub Actions，`versionCode` 由工作流 `run_number` 递增。
- 固定证书指纹见 [release-identity.json](docs/release-identity.json)。CI 会校验证书，错误或缺失时失败，不自动生成新签名。
- 私钥由仓库 Actions Secrets 保存：`ANDROID_KEYSTORE_BASE64`、`ANDROID_KEYSTORE_PASSWORD`、`ANDROID_KEY_ALIAS`、`ANDROID_KEY_PASSWORD`。私钥与密码不进源码。
- 后续下载新 APK 后**覆盖安装**，不要卸载旧版或清除数据。覆盖更新保留 Android 应用私有存储，原有账号和学习记录仍在。
- 课程访问始终使用固定 origin `https://appassets.androidplatform.net`；学习记录使用固定命名空间 `learning-v1-{accountId}`，不能随发版改名或清空。
- 账号、学习记录与 AI 设置保存在 Android 私有 SharedPreferences；JS 在脚本执行前接入绑定当前会话的存储桥。换账号会销毁旧 WebView，防止未完成请求写入另一位账号。
- 卸载、清除应用数据、换手机或签名不一致不属于覆盖更新保留范围。已有浏览器版的记录不会自动转入新 APK。
- 后续更改数据结构要做显式迁移，不使用删除重建；首次发布前的测试不代表今后任意改动都能自动保留。

## GitHub 云端打包

在父项目更新H5后执行 `python growing/scripts/sync-web.py`，将所需HTML/CSS/JS和规则测试同步到仓库，并替换课程内嵌凭据为设备配置占位符。只复制运行所需文件，不复制项目私有设置或对话记录。随后运行 `python growing/scripts/verify-assets.py`、`node --test growing/scripts/*.test.cjs` 和原生朗读适配器测试再提交。

[Android signed APK 工作流](https://github.com/qiangzi0303/growing/actions/workflows/android-release.yml) 在 push 到 `main` 或手动运行时，执行单元测试、Lint、发布构建、签名与模拟器覆盖升级验证，随后上传 Actions artifact、创建 GitHub Release，并自动发布至 Cloudflare 网站。上传使用独立的 `APK_PUBLISH_TOKEN` Secret；APK 存入 KV，版本信息存入 D1，发布后校验公开下载文件的大小与 SHA-256。

项目固定使用 JDK 17、Gradle 8.11.1、AGP 8.9.2、compile/target SDK 35。不在 CI 创建临时签名。

本地构建需 Android SDK 35、JDK 17 或兼容 JDK 与 Gradle 8.11.1，并提供上述签名环境变量及 `ANDROID_KEYSTORE_PATH`，执行：

```text
gradle testDebugUnitTest lintRelease assembleRelease
```

## 后续在线账号

现已加入 PC/H5 学习中心、APK 云同步入口、家长看板与 Cloudflare Workers 管理员后台，使用 Cloudflare D1（SQLite），已发布至 https://growing-platform.qiangzi0303.workers.dev 。管理员可查询全站会员、学生成长曲线与家长核销确认账本；普通账号不能自行获取管理权限。D1 初始化迁移、管理员授权及统计口径见 [跨端平台与管理后台](docs/platform-deployment.md)。APK 继续保留本机账号与离线课程，用户确认关联后才同步学习记录；云服务地址在 `platform-site.json` 中配置。当前部署不再使用 PostgreSQL、Neon 或 Hyperdrive。
