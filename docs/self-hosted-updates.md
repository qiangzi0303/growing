# GitHub 自动打包与 Cloudflare APK 更新

网站下载页：https://007yx.com/download.html

固定更新清单：https://007yx.com/downloads/update.json

APK 和清单在同一站点公开下载，无需登录，手机不必访问 GitHub。

## 自动发布流程

推送 main 或手动运行 Android signed APK 工作流后，GitHub Actions 依次运行课程测试、Android 单元测试、Lint、固定签名构建、证书核验与模拟器覆盖升级测试。构建产物在 GitHub Release 存档，然后 scripts/publish-apk.py 使用独立的 APK_PUBLISH_TOKEN 上传到现有 Worker。

Worker 验证文件大小与 SHA-256，将 APK 保存到 APK_FILES KV，将不可变版本元数据写入 D1 的 GrowingAppReleases 表。只有安装包已存在时才能发布清单。CI 最后从公开地址取回文件，校验完整 APK 的大小和 SHA-256。无需每次人工下载 artifact 再上传，也不需要重新部署网站。

所有 Android 发布任务串行执行。最高 versionCode 为最新版本，较早构建不能降级；同一版本号不能替换 APK 或更新说明。重跑遇到版本冲突时，重新触发工作流取得新编号。

## 安装与升级

PC 网站顶部提供“下载 APK”。适用于 Android 8.0 及以上。已安装者直接覆盖安装，不要卸载旧版或清除应用数据，以保留原账号、学习记录与 AI 设置。

新 APK 从 update-site.json 内置 https://007yx.com/downloads/update.json，GitHub 正式构建固定使用此文件，不再读取仓库变量 GROWING_UPDATE_URL，避免旧配置覆盖。自定义本地构建仍可用同名环境变量覆盖。应用冷启动或从后台返回时自动检查（短暂切换有 30 秒间隔），发现更高版本后提示“下载更新 / 稍后”。点击后浏览器下载 APK，再按 Android 系统提示确认安装。普通应用不能静默覆盖自身。

已经安装的旧 APK 仍使用其内置的旧域名；覆盖安装新版后才切换到 007yx.com。保留旧域名的更新清单和下载服务，使尚未升级的设备也能取得新版。

**早期安装版（例如 1.0.6）没有更新代码或站点配置，需先手动覆盖安装一次包含此功能的新版。** 旧代码不会因服务器配置而自动获得新功能；之后无需再去 GitHub 查找安装包。

## Cloudflare 资源和额度

当前不使用 R2。APK_FILES KV 命名空间 ID 为 d4791757e7614d3f91d25e069610de66，配置在 cloudflare/wrangler.jsonc。数据库迁移为 cloudflare/migrations/0002_app_releases.sql。账号和学习记录仍在 D1，APK 二进制不存入数据库。

KV 单文件上限为 25 MiB，服务端和 CI 都拒绝超限 APK。目前安装包约 5 MB。后续超限时可改用 R2并保留下载路径。免费套餐仍有 KV 读写和存储、Workers 请求量及 D1 额度限制，不代表无限使用。

KV 跨位置最终一致。清单只展示当前请求位置已经可读取的安装包；尚未分发时暂时返回上一可用版本或 503，CI 对网络、限流和分发延迟重试。版本清单使用 Cache-Control: no-store，不应额外配置 Cache Everything。APK 返回 application/vnd.android.package-archive、附件文件名、长度与 SHA-256 ETag。

## 首次配置与迁移

1. 创建 KV 命名空间，配置 APK_FILES 绑定（当前已配置）。
2. 在 growing/cloudflare 目录运行 npm run db:remote，添加版本元数据表；迁移不删除学习数据。
3. 分别在 Worker Secret 与 GitHub Actions Secret 保存同一个独立随机口令，名称均为 APK_PUBLISH_TOKEN。它只允许上传 APK 与版本信息，不能管理 Cloudflare 账号或修改用户学习记录。轮换时同时更新两处，不能提交到代码、网页或 APK。
4. 部署 Worker，提交工作流与相关源码，触发 GitHub 构建。

固定签名仍复用 ANDROID_KEYSTORE_BASE64、ANDROID_KEYSTORE_PASSWORD、ANDROID_KEY_ALIAS、ANDROID_KEY_PASSWORD。不能重新生成签名；证书指纹见 docs/release-identity.json。

## 发布与排障

以下过程由 CI 自动运行。本地仅在已有正式签名 APK 时才需要手动发布：

```text
python scripts/create-update-manifest.py --apk dist/growing-1.0.7.apk --version-code 7 --version-name 1.0.7 --notes-file docs/release-notes.md --output dist/update.json
python scripts/publish-apk.py --manifest dist/update.json
```

口令通过环境变量 APK_PUBLISH_TOKEN 传入，不放在命令行参数中。脚本的 --verify-only 仅校验公开清单和文件，不需要口令。上传请求拒绝重定向，防止凭据转发到其他站点。

401 表示口令无效；409 表示版本已发布且内容不同；413 表示 APK 超过 25 MiB；503 可能是 KV 正在分发、缺少绑定或迁移。不要通过更换 Android 签名处理发布错误。

应用只接受同一 HTTPS 域名和端口的 APK 地址。更换清单域名或路径前，先通过旧地址发布包含新地址的 APK，并保留旧地址供未升级设备使用。浏览器下载不由应用校验哈希；CI 与 Worker 校验发布文件，Android 覆盖安装校验固定签名。
