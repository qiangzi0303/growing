# 成长 · Android

首页仅有数学、英语两张卡片，进入上下册单元目录。数学苏科版全年11章可学习，包含原分式课程及其余10章图文微课；英语目前开放译林版八上 Unit 3，其余单元显示筹备状态。课程 HTML、分式音频、图谱、样式与题库随 APK 离线打包。

数学支持知识图谱、全景图谱和先修薄弱点诊断。分式导航增加“我有疑问”，回答以本单元知识点为主要依据。各单元奖励默认120分钟游戏和200元红包，按正式掌握比例累计；60%对应72分钟和120元。页面显示进度条以及已获得、已核销、可核销额度，分次核销只领取新增差额。课程重置保留历史奖励与核销，旧版已锁定奖励按原约定承接。

## 下载与安装

到 [Releases](https://github.com/qiangzi0303/growing/releases) 下载最新 `growing-*.apk`。Android 8.0 及以上可安装，需要允许来源应用安装 APK。音频、课程与练习可离线使用；AI 评分与答疑需联网。

本版本为**本机账号**：首次使用注册用户名与密码，密码采用随机盐与 PBKDF2-HMAC-SHA256 哈希，不保存明文。退出后可重新登录同机账号；不同账号的课程记录分开保存。本机账号不能跨手机登录，当前没有线上账号服务器或云端进度同步。

AI 接口不内嵌共享密钥。登录后点击原生栏的“账号”，配置自己的 DeepSeek API Key；仅保存在该账号的本机私有设置内。没有密钥仍能学习、播放音频和做题，无法请求真实 AI 评分或答疑。

新数学课堂在 APK 中通过原生注入的请求适配器直连 DeepSeek，不请求电脑端 NumaAI；评分协议与浏览器课堂一致。奖励独立使用 `growing-unit-rewards-v1:<单元ID>`，仍由原有账号隔离存储桥保存。

## 手机朗读

APK 通过 Android 原生 `TextToSpeech` 朗读单词、例句及数学的设备朗读，不依赖 WebView 对 Web Speech 的支持。点击“账号 → 朗读设置 / 英语试读”可以测试并打开系统语音设置。手机须安装可用的 TTS 引擎和英语语音数据；数学设备朗读需要中文数据，内置音频不受此要求影响。离线朗读取决于引擎是否支持并已下载离线数据。数学设备朗读暂停后继续会从当前小段开头重读。后台切换、离开课程和退出账号会停止设备朗读。

## 固定签名与更新保留

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

[Android signed APK 工作流](https://github.com/qiangzi0303/growing/actions/workflows/android-release.yml) 在 push 到 `main` 或手动运行时，执行单元测试、Lint、发布构建、签名验证，随后上传 Actions artifact 并创建 GitHub Release。

项目固定使用 JDK 17、Gradle 8.11.1、AGP 8.9.2、compile/target SDK 35。不在 CI 创建临时签名。

本地构建需 Android SDK 35、JDK 17 或兼容 JDK 与 Gradle 8.11.1，并提供上述签名环境变量及 `ANDROID_KEYSTORE_PATH`，执行：

```text
gradle testDebugUnitTest lintRelease assembleRelease
```

## 后续在线账号

在线注册、跨设备登录与进度同步需要额外的账号服务器、域名/HTTPS、认证和数据存储。GitHub Actions 用于打包，不承担持续运行的账号服务。接入服务时需把本机数据按用户确认的归属导入，保持包名、签名与原有学习存储兼容。
