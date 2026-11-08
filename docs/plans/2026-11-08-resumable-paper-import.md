# 可恢复的分题试卷录入

用户已确认先完整录入与分类，解答、SVG重绘及批改按需执行。采用现有 Worker + D1，逐步请求驱动任务并持久保存进度；关闭页面后保留任务，重新打开可继续，不宣称离线持续运行。保留旧接口供旧客户端使用。

## 实施与验收

1. 真实照片先规划页序、题号和区域，再逐题识别；不发送整套知识点、模型及批改规则。分离题图重绘与初次批改。
2. D1保存任务、原卷、规划和逐题草稿。按学生授权，支持幂等创建、版本与并发租约、失败重试、重开继续；全部完成后原子生成已有试卷记录，不把半卷标为成功。
3. 网页/APK共享界面显示进度、继续/重试任务、原卷预览与旋转检查。按规划裁剪题目后调用识别，保存原卷坐标对应；跨页合并不能丢题。
4. 测试先观察失败再实现；独立规格和质量复核。运行真实编译器、受影响后端及页面测试、资源构建，浏览器验证保存/重开/失败保留。使用用户两张真实照片调用实际模型，区分流程成功与文字准确性。

## 共享接口契约

- `POST /api/question-bank/import-jobs`：`{studentId,requestId,subject,pages}`，pages沿用最多4页、每页500000字符以内JPEG data URL；持久保留所上传版本，不覆盖源文件。返回JobView。
- `GET /api/question-bank/import-jobs?studentId=...&subject=...`：当前学生任务摘要列表，不含图片。
- `GET /api/question-bank/import-jobs/:id?studentId=...`：JobView和`sourcePages:[{page,image}]`。
- `POST /api/question-bank/import-jobs/:id/step`：`{studentId,revision,fragments?:[{page,image,region:{page,x,y,width,height}}]}`；region必须与next中相应region一致。每次只规划一页或识别一道题；没有可信区域时使用原页。返回JobView。429限流保留任务，不算永久失败。
- JobView：`{id,subject,status:'planning'|'recognizing'|'failed'|'complete',revision,pageCount,plannedPages,recognizedQuestions,totalQuestions,paperId:null|string,error:string,next:null|{kind:'plan',page:number}|{kind:'question',number:string,pages:number[],regions:PhotoRegion[]}}`。
- 已完成任务重复step返回相同paperId。failed保留原next与草稿，下次step重试该步骤。
- 合并同题号的跨页来源；规划每页必须明确是否承接前页最后一道题。无法可靠定位时regions为空，保留整页核对并在题目疑点中提示。
- 初次识别参考答案始终为空、drawing=null，不产生评分或虚构批改。保存模式为paper-draft，适配已有确认、作答和按题AI入口。

## 模块分工

- `paper-import-recognition.ts`：`planPage(env,signal,upstream,subject,image,page,pageCount,previousNumber)`；返回`{title,classification,warnings,questions:[{number,regions}],continuesPrevious:boolean,continuationRegions:PhotoRegion[]}`。
- 同模块`transcribeQuestion(env,signal,upstream,subject,task,sourcePages,fragments)`；task包含number/pages/regions，sourcePages包含page/image，返回`{question,warnings}`，question使用现有validatePaper规范。每个来源页同时发送完整原页与可选放大裁剪，裁剪仅供辅助，不作为题目边界；figures一律使用完整原页坐标。响应必须明确complete=true；返回pages与规划一致。
- `paper-import-jobs.ts`与迁移0017：任务持久化、授权、租约、幂等、最终保存。导出`PaperImportJobs(db,user)`，方法`create(data)`、`list(student,subject?)`、`get(student,id)`、`step(student,id,data,env,signal,upstream)`。
- 入口路由由主Agent接入；前端独立Agent修改共享my-papers.js及针对性测试。原有同期工作不覆盖、不自动提交、不发布。

## 已知边界

- 当前版本不引入新的云队列服务；任务在页面打开并继续时推进，断开后可恢复。
- 375KB/页是现有上传约束；源照片文件不修改，但上传保存的是压缩版本。高分辨率原图存储需要独立存储方案，不能宣称已经保留20MB手机原文件。
- 模型仍可能误读公式；通过实际裁剪输入和真实照片核验改善，不能用JSON校验替代准确性验证。

## 人工核对与草稿隔离

- 完成30题转录只表示取得完整结构的草稿，不能证明题设准确。真实照片已发现三次根号、分母误读和题图选框偏移，因此本版本要求人工对照原卷。
- paper-draft仍可在“我的试卷”打开核对，但普通题库、错题/重复练习列表和photo练习记录均排除草稿。
- 每题提供“对照原卷，本题已核对”、题面及单元编辑、三科通用的“核对 / 补充题图”。未检测到图形的题也能补框或补传。
- 纯核对复用`PUT /api/question-bank/questions/:id`，请求`{studentId,revision,figureVersion,reviewed:true}`；同时核对文字与图形版本，只设Reviewed=1，不使SVG或历史批改失效。修改图形后撤销该题审核。
- 整卷确认在一条数据库UPDATE内检查非空且全部Reviewed=1，否则409并保持草稿。已有正式试卷仍可修改分类。

## 真实模型实测记录

- 输入：math/期中前测试卷/1.jpg、2.jpg；预览转正后上传，源文件未改。
- 模型：当前Numa视觉配置deepseek-flash，对真实服务调用；不代表通过实体APK或生产Cloudflare网络完成测试。
- 两页规划耗时约6.5秒和3.6秒，共清点30题，复习卷归other。
- 首轮单题裁剪漏掉第1题选项；已改为整页+裁剪后补齐。旧结果保留在临时目录，未混入重测。
- 首轮第2题JSON反斜杠不合法；补充可解析的LaTeX JSON示例。后续第15题因4×4未放入数学环境被拒绝，补充公式约束后从该题继续，完成30题。
- 流程完成仍有实际错误：第21题三次根号被读成平方根；第29题第（2）问分母被误读。图框也存在偏移。未以30/30结构成功作为准确率通过，未将这份识别草稿写入生产。
- 原始响应、耗时、草稿及照片核对证据：项目`.nmai/tmp/paper-import-real-20261108/`。含编码图片的JSON和含密钥的配置不应粘贴到对话或提交仓库。

## 本地验收结果（2026-11-08）

- 后端8个相关测试文件52/52通过，另英语试卷回归4/4通过；使用真实D1迁移、真实HTTP路由及模拟上游，覆盖任务幂等、跨页、失败恢复、租约、权限撤销、容量竞争、完整后原子保存、无首次评分、草稿隔离与核对守卫。日志在`.nmai/tmp/paper-import-backend-final.log`、`paper-import-english-final.log`。
- 前端3个相关测试文件30/30通过；覆盖暂停/刷新恢复、上传失败保留、学生切换隔离、限流、真实坐标裁剪、旋转、显式审核请求与图框入口。日志在`.nmai/tmp/paper-import-ui-final.stdout.log`。
- TypeScript `tsc --noEmit`和修改的JavaScript语法检查通过。资源构建退出码0，生成1097个静态文件；5个受影响资源在网页源、APK内嵌副本、Worker根路径及learn/cloud路径的SHA256一致。缓存版本已更新为resumable-paper-1。
- Worker `wrangler deploy --dry-run`试打包退出码0；此命令未发布到线上。日志在`.nmai/tmp/paper-import-worker-bundle.log`。
- 最终Chrome浏览器验收PASS、0页面异常：数学/英语/物理导入，物理双页续题，失败后刷新重试，暂存重开，canvas旋转，亲子共享/越权拒绝，草稿不出现在普通题库，未逐题审核确认返回409，逐题核对后可确认，三科均可打开人工图框编辑器。1440/390/320宽度已截图并目视核对，无横向溢出。
- 浏览器证据在`.nmai/tmp/paper-import-final-qa/browser-result.json`及同目录截图。初轮在本地QA控制接口遇到一次空闲连接ECONNRESET；服务仍正常，测试仅为幂等GET增加传输重试后全流程通过，未修改业务接口来掩盖错误。
- 上述浏览器使用合成照片和模拟视觉服务；真实照片调用是另外的本机实测。未进行生产数据库迁移、线上发布、APK打包安装或实体手机相机验收。APK内嵌网页已同步，不等同于已生成新APK。
- 原计划的全后端测试曾因Numa Agent会话文件权限中断而未跑完，不计为通过；本次以完成的56项相关后端回归为准。
