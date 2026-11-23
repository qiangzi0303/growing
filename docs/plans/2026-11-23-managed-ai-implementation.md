# 统一配置、前端直连与用量上报实施计划

> 实施者：先增加有意义的失败测试，再实现并验证。不自动提交，不部署。用户已明确指定直连方式，无需重新确认。

目标：个人 Key 设置移入后台，前端首次获取配置后直连模型，按登录账户统计 usage。

架构：Cloudflare Workers + D1 提供管理、已认证配置获取和用量记录接口；共享 course-ai.js 管理会话内存缓存和上报；后台 Naive UI 展示配置和统计；网站和 APK 通过现有登录身份复用。

## 接口约定

- GET /api/admin/ai/models → {models:[{id,purpose,model,endpoint,enabled,revision,configured,keyHint,voice?}]}。
- PUT /api/admin/ai/models/:id，id 为 chat/realtime/vision/paperRecognition/paperFigure；{model,endpoint,apiKey?,enabled,voice?}，apiKey 省略/空白表示沿用；enabled:false 为禁用。更新返回掩码行。Key AES-GCM 加密存 D1，Workers Secret AI_CONFIG_ENCRYPTION_KEY 作为主密钥，不允许明文回退。
- GET /api/ai/config → {models:[{id,purpose,model,endpoint,apiKey,revision,voice?}]}，只返回启用项，登录验证、no-store；chat/视觉 endpoint 是完整 chat/completions URL，realtime endpoint 是完整 SDP URL（model 参数由客户端补齐）。
- POST /api/ai/usage → {ok:true}；{requestId,configId,configRevision,feature,status,inputTokens,outputTokens,totalTokens,providerRequestId?}；status success/error/cancelled，缺失 usage 时 tokens 都为 null。归属账户来自会话，来源固定 client，按账户+requestId 幂等。
- GET /api/admin/ai/usage?from=YYYY-MM-DD&to=YYYY-MM-DD&userId=&configId=&page=1&pageSize=20 → {summary:{inputTokens,outputTokens,totalTokens,requests,unknownRequests,failedRequests},accounts:[{userId,username,displayName,inputTokens,outputTokens,totalTokens,requests,unknownRequests,failedRequests}],calls:[{requestId,userId,username,displayName,configId,model,feature,status,source,inputTokens,outputTokens,totalTokens,createdAt}],total,page,pageSize}。日期为北京时间自然日，结束日期包含当天。

## 后台

growing/cloudflare/src/managed-ai.ts、index.ts、migrations/0020_managed_ai.sql、test/managed-ai.test.ts：权限、加密、掩码、no-store、参数限制、未知 usage、幂等、账户隔离和日期统计测试。执行 node --import tsx --test test/managed-ai.test.ts 和 tsc --noEmit。禁止凭客户端 userId 记账。

## 共享前端

app-design/course-ai.js、companion-duck/ai-client.js、realtime-client.js 及 tests：配置并发合并与内存缓存、换账号隔离、供应商直连、usage 上报失败不吞结果、语音 response.done 幂等。沿用 request/info/settingsMarkup 消费契约，个人保存接口停用，不读取旧 Key。可保留音色偏好，无个人地址/Key。

## 管理界面

growing/console-web/src/features/ai/*、views/ai-models/index.vue、views/ai-usage/index.vue、路由及账号页：读 AGENTS 及其技能，使用 Naive UI 配置表单、掩码、留空沿用、启停、用量筛选/分页。标注客户端上报。组件测试、vue-tsc、生产构建。

## 设置入口、原生与资产

移除 platform-web/cloud/home-settings/vant-home/learning-ui 个人 Key 设置；Android LearningBridge 不返回个人 Key，菜单改统一配置状态。原英语 Unit 3、分式旧模块统一共享调用。按既有脚本构建 learning-ui 并同步资产，不将 bundle 当源代码编辑。

## 集成审查

已有后台视觉工作流接入管理配置和服务器 usage，不新增代理层。运行针对性 API/JS/组件测试、Workers check/bundle、UI 构建和 Android 编译检查。浏览器模拟供应商验证配置→直连→上报→统计及账户切换。完成规格和质量审查。真实供应商 CORS、主密钥配置、真机麦克风等未验证项明确报告，不自动发布。
