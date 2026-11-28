/* Original visual explanations for the five existing Unit 5 lessons; no new scored nodes. */
window.GrowingGrammarSceneLessons={
 reading:{tab:'1. 熊猫保护',title:'阅读：成长 → 困境 → 保护',intro:'先用成长线认识希望，再用因果线理解野生熊猫的处境。画面是阅读导学示意。',scene:'unit5-reading',cuts:[2,4],steps:[
  {label:'1. 成长',at:.18,title:'个体成长：先找时间顺序',sentence:'Xiwang <mark>grew up</mark>.',translation:'希望长大了。',explain:'阅读 Protecting pandas 时，按时间顺序整理希望的成长。小熊猫的变化属于<strong>个体成长线</strong>，不要把一个个体的情况等同于全部野生熊猫。'},
  {label:'2. 困境',at:.43,title:'从“吃什么”理解“为什么有困难”',sentence:'Pandas <mark>live mainly on bamboo</mark>.',translation:'熊猫主要以竹子为食。',explain:'<strong>live on</strong> 表示“以吃……为生”。竹林减少，会影响食物和生活空间。读到 <strong>as a result</strong>（因此）时，向前找原因、向后找结果。'},
  {label:'3. 保护',at:.69,title:'问题对应措施，再看变化',sentence:'We should <mark>take action</mark> to protect pandas.',translation:'我们应该采取行动保护熊猫。',explain:'把“困境”与“保护区、法律、科研”等措施对应起来。<strong>thanks to</strong> 表示“多亏”，引出带来积极变化的原因；不能把希望的成长当作所有野生熊猫已安全的证据。'}
 ],pitfall:'<strong class="bad">thanks to + 带来帮助的人或事；thanks for + 感谢的事情。</strong><br>Thanks to your help, we finished the work. / Thanks for your help.'},
 'verb-to':{tab:'2. 动词 + to do',title:'动词后面：计划做什么？',intro:'先有计划，再说计划的内容；最后对比一个搭配不同的动词。',scene:'unit5-verb',cuts:[2,4],steps:[
  {label:'1. 计划做',at:.18,title:'plan 后用 to + 动词原形',sentence:'We plan <mark>to protect</mark> wild animals.',translation:'我们计划保护野生动物。',explain:'<strong>plan / hope / decide / agree / learn + to do</strong>。这里 to protect 补充“计划的内容”，不是说保护行动已经完成。'},
  {label:'2. 决定不做',at:.43,title:'否定放在 to 前',sentence:'We decided <mark>not to hurt</mark> the animals.',translation:'我们决定不伤害这些动物。',explain:'不定式的否定形式是 <strong>not to do</strong>。决定“不伤害”，不是“没有作决定”：两者意思不同。'},
  {label:'3. 对比搭配',at:.69,title:'换了前面的动词，后面也要检查',sentence:'We enjoy <mark>watching</mark> birds.',translation:'我们喜欢观鸟。',explain:'<strong>enjoy / finish + doing</strong>。先看前面的动词，再选后面的形式；不能因为都是“做某事”就全写成 to do。'}
 ],pitfall:'<span class="bad">✗ enjoy to watch / plan protecting</span><br><span class="good">✓ enjoy watching / plan to protect</span>'},
 purpose:{tab:'3. 表达目的',title:'用 to do 回答：为什么做？',intro:'志愿者举起海报，这是行动；让人们了解野生动物，是行动的目的。',scene:'unit5-purpose',cuts:[2,4],steps:[
  {label:'1. 做了什么',at:.18,title:'先找主要动作',sentence:'We <mark>put up a poster</mark>.',translation:'我们张贴了一张海报。',explain:'这句话回答“做了什么”。继续追问：<strong>Why did we put up a poster?</strong>（为什么张贴海报？）'},
  {label:'2. 为什么做',at:.43,title:'to do 连接动作与目的',sentence:'We put up a poster <mark>to tell people about wildlife</mark>.',translation:'我们张贴海报，让人们了解野生动物。',explain:'<strong>to tell…</strong> 表达目的，相当于“为了告诉……”。主要动作是 put up；后面的不定式回答 why。'},
  {label:'3. 换个位置',at:.69,title:'目的也可以放在句首',sentence:'<mark>To protect animals</mark>, we build reserves.',translation:'为了保护动物，我们建立保护区。',explain:'目的不定式可以在句首，后面常用逗号。换位置后仍然要能回答“为什么建立保护区”。这里保护动物是目标，不能只凭目的表达就认定目标已实现。'}
 ],pitfall:'<strong class="bad">看作用，不能只看到 to 就说“表示目的”。</strong><br>We plan to help animals 中 to help 是计划的内容；We work hard to help animals 中 to help 说明努力的目的。'},
 'object-to':{tab:'4. 宾语后接什么',title:'谁让谁做：有时带 to，有时不带',intro:'逐步看 ask、make、help 和 see 的搭配。播放当前场景，点击步骤比较句子的意思。',scene:'unit5-ask',steps:[
  {label:'1. ask / tell',at:.4,title:'先说对象，再说要求做什么',sentence:'The keeper asked us <mark>not to feed</mark> the animals.',translation:'饲养员请我们不要喂动物。',explain:'<strong>ask / tell / want / invite sb to do</strong>。这里 us 是对象，not to feed 是对我们的要求。否定用 <strong>sb not to do</strong>。'},
  {label:'2. make 主动',at:.23,playUntil:2.7,scene:'grammar-make',title:'主动 make：原形前不带 to',sentence:'The boss made me <mark>work</mark> overtime.',translation:'老板让我加班。',explain:'<strong>make / let sb do</strong>：主动结构省略 to。比较 asked me to work 与 made me work，观察动词换了以后后面的形式怎样变化。'},
  {label:'3. make 被动',at:.57,playFrom:2.8,scene:'grammar-make',title:'换成被要求的人作主语，to 要回来',sentence:'I <mark>was made to work</mark> overtime.',translation:'我被要求加班。',explain:'同一件事，换了叙述重点。<strong>make sb do → sb be made to do</strong>。这条被动规律不能机械套到所有动词。'},
  {label:'4. help',at:.4,scene:'unit5-help',title:'help 后的 to 可以保留或省略',sentence:'We helped them <mark>(to) protect</mark> the animals.',translation:'我们帮助他们保护动物。',explain:'<strong>help sb do / help sb to do</strong> 都可以。与主动 make sb do 不同，help 后的 to 是可选的。'},
  {label:'5. see + do',at:.7,scene:'grammar-see-whole',title:'看见完整过程',sentence:'I saw him <mark>cross</mark> the bridge.',translation:'我看见他过了桥。（这里强调全过程。）',explain:'<strong>see / hear sb do</strong> 可以强调全过程，在合适语境中也可表示经常发生的动作。主动结构不用 to cross。'},
  {label:'6. see + doing',at:.39,scene:'grammar-see-part',title:'强调看见时正在进行',sentence:'I saw him <mark>crossing</mark> the bridge.',translation:'我看见他正在过桥。',explain:'<strong>see / hear sb doing</strong> 强调观察时动作正在进行。它本身不说明你有没有看见开始与结束，更不表示这个动作最终没完成。'}
 ],pitfall:'<span class="bad">✗ asked us not feed / made us to wait / was made work</span><br><span class="good">✓ asked us not to feed / made us wait / was made to work</span>'},
 writing:{tab:'5. 保护倡议',title:'综合运用：从发现危险到提出行动',intro:'用“动物特征 → 面临危险 → 具体行动”组织倡议，再检查词形。',scene:'unit5-writing',cuts:[2,4],steps:[
  {label:'1. 特征与困境',at:.18,title:'先说明保护谁、为什么需要保护',sentence:'Pandas live on bamboo. Their homes are <mark>in danger</mark>.',translation:'熊猫以竹子为食。它们的家园处于危险中。',explain:'把动物的特点和具体困难连接起来。<strong>danger</strong> 是名词，<strong>dangerous</strong> 是形容词；in danger 表示“处于危险中”，不能写成 in dangerous。'},
  {label:'2. 具体行动',at:.43,title:'让读者知道能做什么',sentence:'Let’s <mark>protect their homes</mark> and reduce pollution.',translation:'让我们保护它们的家园、减少污染。',explain:'行动要对应问题。保护栖息地、减少污染比“我喜欢动物”更像倡议。也可用目的不定式说明行动理由：We build reserves <strong>to protect animals</strong>。'},
  {label:'3. 检查词形',at:.69,title:'用名词说出品质与行动',sentence:'Show <mark>kindness</mark>. Take <mark>action</mark>.',translation:'善待动物，采取行动。',explain:'<strong>kind → kindness</strong>；action、protection 是常见名词。构词要结合词义和句子检查，不能把 -ness 或 -ion 随意加到任何词后。satisfying 中的 -ing 构成形容词。'}
 ],pitfall:'<span class="bad">✗ Animals are in dangerous.</span><br><span class="good">✓ Animals are in danger.</span><br>“处于危险中”与“本身危险”不同：The animal is dangerous 表示这种动物有危险性。'}
};
