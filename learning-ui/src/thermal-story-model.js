// Original browser adaptation of Math-To-Manim's computed motion and shot grammar.
// Reference mapping: .nmai/skills/physics-interactive-animation/references/math-to-manim.md
export const thermalStories = {
  'phy-temperature': {
    title: '让温度计与水达到同一温度', question: '刚放进去，读数为什么还在变？', kind: 'thermometer',
    shots: [['放入水中','先让玻璃泡充分接触水，不能碰到容器底或壁。'],['看清液柱','放大刻度：液柱上升是温度计逐渐接近水温的表现。'],['等待稳定','示数仍在变化时，读到的是温度计此刻的温度。'],['平视读数','示数稳定后，玻璃泡留在水中，视线与液柱顶端相平。']],
    controls: [{key:'water',label:'水的温度',min:10,max:80,step:5,unit:'°C',value:50},{key:'placement',label:'玻璃泡的位置',options:[['correct','浸入水中，不碰底壁'],['wall','碰到容器壁'],['outside','未接触水']],value:'correct'},{key:'eye',label:'观察方向',options:[['level','平视'],['above','俯视'],['below','仰视']],value:'level'}],
    note:'温度计从20 °C开始，按指数规律趋近水温；响应时间只用于演示。碰壁时器壁温度未知，不能用当前示数判断水温。',
  },
  'phy-cooling': {
    title: '越接近室温，降温越慢', question:'前后相同的一分钟，温度会降低一样多吗？', kind:'cooling',
    shots:[['热水与房间','水温高于室温，热量从热水传向环境。'],['看温差','温差越大，其他条件相同时，开始降温越快。'],['追踪曲线','时间向前走，等长时间段内的温降逐渐变小。'],['回到平衡','曲线逐渐接近室温；这个模型中不会自行降到室温以下。']],
    controls:[{key:'initial',label:'初始水温',min:50,max:90,step:5,unit:'°C',value:80},{key:'room',label:'环境温度',min:5,max:35,step:5,unit:'°C',value:20}],
    note:'采用牛顿冷却近似，T=T环境+(T初−T环境)e^(−0.18t)，t以分钟计；系数固定以比较温差，未模拟蒸发、容器差异。',
  },
  'phy-evaporation': {
    title:'只改一个条件，看蒸发快慢',question:'同一杯水摊开后，为什么通常干得更快？',kind:'evaporation',
    shots:[['同样多的水','左边作为对照，右边只改变一个条件。'],['放大水面','蒸发发生在表面；任何温度下都可能发生。'],['持续比较','同样演示进度，比较两边留下的水量示意。'],['解释差异','温度、表面积、空气流动都能影响蒸发快慢；蒸发需要吸热。']],
    controls:[{key:'factor',label:'本次只改变',options:[['area','表面积'],['temperature','温度'],['wind','空气流动']],value:'area'},{key:'strength',label:'该条件的增强程度',min:1,max:3,step:.5,unit:'倍（示意）',value:2}],
    note:'液面和逸出粒子是定性示意，进度不是实测时间。倍数只控制演示强弱，不是温度、风速与蒸发量的定量定律；两杯初始水量相同。',
  },
  'phy-boiling': {
    title:'水沸腾了，热量还去了哪里？',question:'温度不再升高，是否就不再吸热？',kind:'boiling',
    shots:[['开始加热','水从20 °C开始吸热，温度逐渐升高。'],['到达沸点','标准大气压下，纯水在100 °C达到沸点。'],['看见内部汽化','沸腾时表面和内部同时发生剧烈汽化，仍需供热。'],['关掉热源试试','停止供热后不能维持沸腾；离开壶口的白雾是液化小水滴。']],
    controls:[{key:'power',label:'有效加热功率',min:100,max:500,step:50,unit:'W',value:300},{key:'mass',label:'初始水质量',min:50,max:200,step:25,unit:'g',value:100},{key:'heater',label:'当前持续供热',options:[['on','供热'],['off','停止供热，观察当前时刻']],value:'on'}],
    note:'标准大气压、纯水、理想保温模型：c水=4200 J/(kg·°C)，汽化潜热取2.26×10⁶ J/kg。演示到约10%水汽化；关闭热源冻结当前热量，未模拟随后冷却。热量公式用于驱动画面，不要求本单元记忆。',
  },
  'phy-liquid': {
    title:'冷杯外的水，从哪里来？',question:'杯子没有漏水，外壁为什么变湿？',kind:'condensation',
    shots:[['观察冷杯','空气中原有看不见的水蒸气，水不必从杯内渗出来。'],['放大外壁','杯壁低于空气露点时，水蒸气在外壁液化。'],['水滴长大','小水滴逐渐聚集；气态变液态，向周围放热。'],['改变杯壁温度','把杯壁调到露点以上，这个简化模型中不再产生新露滴。']],
    controls:[{key:'wall',label:'杯壁温度',min:2,max:28,step:2,unit:'°C',value:8},{key:'dew',label:'空气露点',min:10,max:24,step:2,unit:'°C',value:18}],
    note:'露点是空气中水蒸气开始凝结的温度。水滴大小为定性示意，不代表实测凝结量；假设环境温度30 °C。',
  },
  'phy-melting': {
    title:'冰在变少，温度却停在0 °C',question:'继续吸热时，是温度升高，还是冰变成水？',kind:'melting',
    shots:[['先让冰升温','标准大气压下，纯冰从−20 °C开始受热。'],['靠近冰水界面','到达0 °C后，冰和水同时存在；吸热用于熔化。'],['对照平台','冰逐渐减少，温度曲线留下平台：温度不变不等于不吸热。'],['全部熔化之后','冰全部变成水后，继续吸热，水温才重新升高。']],
    controls:[{key:'direction',label:'观察过程',options:[['melt','熔化：向物体供热'],['freeze','凝固：从物体移走热量']],value:'melt'},{key:'power',label:'热量传递功率',min:50,max:300,step:25,unit:'W',value:150},{key:'mass',label:'物质质量',min:25,max:100,step:25,unit:'g',value:50}],
    note:'标准大气压下纯冰/水的理想模型：冰比热2100、水比热4200 J/(kg·°C)，熔化潜热334000 J/kg。熔化与凝固都在0 °C发生；非晶体不适用这条平台曲线。',
  },
  'phy-sublimation': {
    title:'直接跨过液态的变化',question:'霜和露，看起来都在表面出现，变化路径一样吗？',kind:'sublimation',
    shots:[['辨认起点','先确认变化前的物态，不靠颜色或外形猜名称。'],['跟随变化','升华由固态直接到气态；凝华的方向相反。'],['检查有没有液态','这条路径不经过液态。霜是固态冰晶，露是液态小水滴。'],['标明吸放热','升华吸热，凝华放热；干冰周围的白雾不是二氧化碳气体本身。']],
    controls:[{key:'direction',label:'观察对象',options:[['sublime','干冰升华：固态 → 气态'],['deposit','结霜：水蒸气 → 固态']],value:'sublime'},{key:'rate',label:'演示速率',min:.5,max:2,step:.5,unit:'×',value:1}],
    note:'粒子和状态比例为定性示意，不模拟具体气压或分子轨迹。干冰在通常大气压下升华；凝华路径用于解释适宜条件下的结霜。',
  },
  'phy-water-cycle': {
    title:'跟着一滴水，走完一次循环',question:'水在移动，是否就一定发生物态变化？',kind:'cycle',
    shots:[['从水面出发','太阳供能，液态水蒸发成看不见的水蒸气。'],['来到高空','水蒸气遇冷形成小水滴，或在相应条件下形成冰晶。'],['回到地面','雨滴下落是位置改变；冰晶长大形成降雪也包含迁移。'],['流回河海','雨水径流没有改变物态；积雪需先熔化成水，再汇入河流。']],
    controls:[{key:'route',label:'观察路径',options:[['rain','小水滴 → 降雨'],['snow','冰晶 → 降雪 → 融雪']],value:'rain'},{key:'rate',label:'演示速率',min:.5,max:2,step:.5,unit:'×',value:1}],
    note:'这是水循环中的两条简化路径，不代表所有云和降水的形成方式。云中可有水滴、冰晶或二者共存；运动轨迹和过程时间为示意。',
  },
};
export const thermalNodeIds=Object.keys(thermalStories);
export const clamp=(x,lo=0,hi=1)=>Math.max(lo,Math.min(hi,x));
export const thermalDefaults=id=>Object.fromEntries(thermalStories[id].controls.map(c=>[c.key,c.value]));
const throughShots=(p,bounds)=>{const i=Math.min(3,Math.floor(p*4));return bounds[i]+(bounds[i+1]-bounds[i])*(p*4-i);};

// Seekable, deterministic state. Physical time is distinct from the film's 32-second timeline.
export function thermalState(id, values, progress){
  const s=thermalStories[id], p=clamp(progress), stage=Math.min(3,Math.floor(p*4));
  const v={...thermalDefaults(id),...values}, state={kind:s.kind,p,stage,temperature:20,liquid:1,gas:0,heat:0,time:0,stats:[],active:true};
  if(s.kind==='melting'){
    const mass=v.mass/1000, total=mass*(2100*20+334000+4200*20);
    const warming=v.direction==='melt', a=mass*(warming?2100:4200)*20, latent=mass*334000;
    const q=throughShots(p,[0,a,a+latent*.5,a+latent,total]);
    state.heat=q;state.time=q/v.power;state.duration=total/v.power;
    const converted=clamp((q-a)/latent);state.liquid=warming?converted:1-converted;
    state.temperature=q<a?(warming?-20+q/(mass*2100):20-q/(mass*4200)):q<=a+latent?0:(warming?(q-a-latent)/(mass*4200):-(q-a-latent)/(mass*2100));
    state.status=state.liquid>0&&state.liquid<1?'冰水共存':state.liquid===0?'固态冰':'液态水';
    state.energy=warming?'吸热':'放热';
    state.stats=[['温度',`${state.temperature.toFixed(1)} °C`],['液态比例',`${(100*state.liquid).toFixed(0)}%`],['累计'+state.energy,`${(q/1000).toFixed(2)} kJ`],['过程时间',`${state.time.toFixed(1)} s`]];
  }else if(s.kind==='boiling'){
    const mass=v.mass/1000, heating=mass*4200*80,total=heating+mass*.1*2260000,q=throughShots(p,[0,heating*.5,heating,heating+mass*.05*2260000,total]);
    state.temperature=Math.min(100,20+q/(mass*4200));state.gas=Math.max(0,(q-heating)/2260000/mass);state.liquid=1-state.gas;
    state.heat=q;state.time=q/v.power;state.duration=total/v.power;state.active=v.heater==='on';state.boiling=q>=heating&&state.active;
    state.status=!state.active?'停止供热':state.boiling?'沸腾 · 温度保持100 °C':'吸热升温';
    state.stats=[['温度',`${state.temperature.toFixed(1)} °C`],['汽化质量',`${(mass*state.gas*1000).toFixed(1)} g`],['已供热',`${(q/1000).toFixed(2)} kJ`],['加热时间',`${state.time.toFixed(1)} s`]];
  }else if(s.kind==='cooling'){
    state.time=p*15;state.temperature=v.room+(v.initial-v.room)*Math.exp(-.18*state.time);
    state.status='向环境放热';state.stats=[['水温',`${state.temperature.toFixed(1)} °C`],['室温',`${v.room} °C`],['温差',`${(state.temperature-v.room).toFixed(1)} °C`],['经过时间',`${state.time.toFixed(1)} min`]];
  }else if(s.kind==='thermometer'){
    state.time=p*24;state.temperature=v.placement==='outside'?20:20+(v.water-20)*(1-Math.exp(-state.time/4));state.valid=v.placement==='correct'&&v.eye==='level'&&p>=.75;
    state.status=v.placement!=='correct'?'位置不正确，不能据此读水温':v.eye!=='level'?'调整视线，平视液柱顶端':p<.75?'液柱变化中，继续等待':'示数稳定，可以读数';
    state.stats=[['液柱示数',`${state.temperature.toFixed(0)} °C`],['水的温度',`${v.water} °C`],['读数条件',state.valid?'符合规范':'尚不符合'],['等待时间',`${state.time.toFixed(1)} s`]];
  }else if(s.kind==='evaporation'){
    state.base=1-.22*p;state.liquid=1-.22*p*v.strength;state.status='从液体表面汽化 · 吸热';
    state.stats=[['对照条件','保持不变'],['唯一变量',{area:'表面积',temperature:'温度',wind:'空气流动'}[v.factor]],['实验组蒸发',v.strength===1?'与对照相同':'更快（示意）'],['发生位置','液体表面']];
  }else if(s.kind==='condensation'){
    state.active=v.wall<v.dew;state.drops=state.active?p*clamp((v.dew-v.wall)/12):0;
    state.status=state.active?'水蒸气在外壁液化 · 放热':'没有新露滴生成';
    state.stats=[['杯壁温度',`${v.wall} °C`],['空气露点',`${v.dew} °C`],['能否结露',state.active?'能':'不能'],['水滴来源','空气中的水蒸气']];
  }else if(s.kind==='sublimation'){
    state.gas=v.direction==='sublime'?p:1-p;state.liquid=0;state.status=v.direction==='sublime'?'固态 → 气态 · 吸热':'气态 → 固态 · 放热';
    state.stats=[['过程',v.direction==='sublime'?'升华':'凝华'],['有没有液态','不经过液态'],['能量方向',v.direction==='sublime'?'吸热':'放热'],['材料',v.direction==='sublime'?'干冰':'水']];
  }else{
    const snow=v.route==='snow';state.status=[ '蒸发 · 吸热',snow?'凝华形成冰晶 · 放热':'液化形成云滴 · 放热',snow?'降雪 · 位置改变':'降雨 · 位置改变',snow?'融雪吸热，再径流':'径流 · 没有相变'][stage];
    state.stats=[['所在环节',['水面','高空','降水','河流'][stage]],['当前过程',state.status],['云中物态',snow?'固态冰晶':'液态小水滴'],['这次追踪','简化的一条路径']];
  }
  return state;
}

export function thermalCurve(id,values){
  if(!['melting','boiling','cooling','thermometer'].includes(thermalStories[id].kind))return [];
  return Array.from({length:101},(_,i)=>{const s=thermalState(id,values,i/100);return {p:i/100,t:s.temperature,time:s.time};});
}
