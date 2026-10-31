import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';

const viewport = document.querySelector('#viewport');
const loading = document.querySelector('#loading');
try { await init(); } catch (error) {
  console.error(error);
  loading.classList.add('error');
  loading.textContent = '3D 暂时无法显示。请使用支持 WebGL 的浏览器打开此页。';
}

async function init() {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  viewport.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(33, 1, .1, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 7;
  controls.maxDistance = 17;
  controls.minPolarAngle = .4;
  controls.maxPolarAngle = Math.PI / 2 + .05;
  controls.autoRotateSpeed = .65;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  scene.add(new THREE.HemisphereLight(0xe9f6ff, 0x7d826b, 2.2));
  const key = new THREE.DirectionalLight(0xfff6e4, 3);
  key.position.set(4, 8, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -5; key.shadow.camera.right = 5;
  key.shadow.camera.top = 7; key.shadow.camera.bottom = -5;
  key.shadow.normalBias = .025;
  key.shadow.bias = -.0001;
  key.shadow.radius = 5;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xcce8e8, 1.6);
  fill.position.set(-5, 4, 2); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 2.6);
  rim.position.set(-1, 6, -5); scene.add(rim);

  const material = (color, metalness = 0, roughness = .4) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const shell = material(0x81d0cd, .15, .3);
  const porcelain = material(0xf2f0df, .05, .34);
  const orange = material(0xff791c, .12, .3);
  const yellow = material(0xf4c33d, .14, .33);
  const graphite = material(0x263638, .65, .32);
  const rubber = material(0x172323, .1, .66);
  const metal = material(0x9da9a2, .78, .26);
  const darkMetal = material(0x50615e, .75, .3);
  const lens = material(0x081519, .55, .09);
  const lensGlass = new THREE.MeshPhysicalMaterial({ color:0x123c49, metalness:.25, roughness:.08, clearcoat:1, clearcoatRoughness:.03 });
  const led = new THREE.MeshStandardMaterial({color:0xade6d9, emissive:0x68c7ac, emissiveIntensity:.8, roughness:.25});
  const robot = new THREE.Group(); robot.name = 'StudyDuck'; scene.add(robot);
  robot.userData = { description:'Independent procedural mechanical duck, inspired by MicroDuck.', version:'1.0' };
  const torso = new THREE.Group(); torso.name = 'Body'; torso.position.y = 1.93; robot.add(torso);
  const joints = {};

  function mesh(geometry, mat, parent, x=0, y=0, z=0) {
    const m = new THREE.Mesh(geometry, mat); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
  }
  function box(w,h,d,r,mat,parent,x=0,y=0,z=0) {
    return mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/2,h/2,d/2)),mat,parent,x,y,z);
  }
  function ball(r, mat, parent, x,y,z, sx=1,sy=1,sz=1) {
    const m=mesh(new THREE.SphereGeometry(r,24,16),mat,parent,x,y,z);m.scale.set(sx,sy,sz);return m;
  }
  function cylinder(r,depth,mat,parent,x,y,z,axis='x',innerRadius=r) {
    const m=mesh(new THREE.CylinderGeometry(r,innerRadius,depth,40),mat,parent,x,y,z);
    if(axis==='x')m.rotation.z=Math.PI/2;
    if(axis==='z')m.rotation.x=Math.PI/2;
    return m;
  }
  function rod(a,b,r,mat,parent) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta=end.clone().sub(start);
    const m=mesh(new THREE.CylinderGeometry(r,r,delta.length(),12),mat,parent);
    m.position.copy(start.add(end).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()); return m;
  }
  function wire(points, radius, parent, mat=rubber) {
    const curve = new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    return mesh(new THREE.TubeGeometry(curve,32,radius,8,false),mat,parent);
  }
  function screw(parent,x,y,z,axis='x',size=.037) {
    const m=cylinder(size,.017,metal,parent,x,y,z,axis);
    const slot=box(size*1.1,.009,.006,.002,graphite,m,0,.011,0);slot.rotation.y=.4;
  }
  function servo(parent,x,y,z,r=.18,side=1) {
    cylinder(r,.13,graphite,parent,x,y,z);
    cylinder(r*.77,.145,metal,parent,x+side*.015,y,z);
    cylinder(r*.47,.15,darkMetal,parent,x+side*.023,y,z);
    cylinder(r*.23,.165,metal,parent,x+side*.03,y,z);
    for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;screw(parent,x+side*.082,y+Math.cos(a)*r*.59,z+Math.sin(a)*r*.59);}
  }

  // Wide duck feet, open linkage legs and exposed rotary servos.
  for(const side of [-1,1]) {
    const leg=new THREE.Group();leg.name=side<0?'LeftLeg':'RightLeg';leg.position.x=side*.45;robot.add(leg);joints['leg'+side]=leg;
    box(.64,.12,1.05,.08,yellow,leg,0,.08,.15);
    box(.56,.15,.88,.08,orange,leg,0,.19,.13);
    box(.37,.055,.56,.03,graphite,leg,0,.29,-.01);
    for(const z of [.37,.5])box(.37,.008,.015,.002,rubber,leg,0,.274,z);
    box(.2,.37,.28,.035,graphite,leg,0,.43,-.07);
    servo(leg,side*.15,.47,-.07,.135,side);
    // Split shank forms an open mechanical bracket.
    for(const flank of [-1,1]) {
      const shank=box(.075,.62,.13,.025,darkMetal,leg,flank*.145,.85,-.135);shank.rotation.x=-.22;
      rod([flank*.145,.56,-.01],[flank*.145,1.16,-.25],.024,metal,leg);
    }
    servo(leg,side*.17,1.16,-.2,.17,side);
    box(.34,.3,.36,.04,graphite,leg,0,1.2,-.2);
    box(.11,.62,.18,.025,darkMetal,leg,-side*.12,1.5,-.08).rotation.x=.3;
    box(.09,.61,.17,.025,metal,leg,side*.14,1.5,-.08).rotation.x=.3;
    // Colored thigh guards, with a visible gap over the frame.
    const guard=box(.105,.5,.39,.045,shell,leg,side*.25,1.47,.01);guard.rotation.x=.13;
    screw(leg,side*.31,1.64,.02);screw(leg,side*.31,1.3,-.02);
    wire([[0,.44,-.23],[.08,.66,-.26],[.06,1.0,-.37],[0,1.45,-.23]],.024,leg);
  }
  box(.91,.26,.65,.07,graphite,torso,0,-.03,-.04);
  cylinder(.23,1.15,graphite,torso,0,.01,-.03);
  for(const side of [-1,1])servo(torso,side*.58,.01,-.03,.22,side);
  box(.91,.58,.71,.16,shell,torso,0,.39,0);
  box(.71,.1,.53,.05,graphite,torso,0,.73,-.04);
  // Front panel, trim line, chest lamp and little speaker grille.
  box(.53,.31,.035,.055,porcelain,torso,0,.41,.365);
  box(.3,.04,.015,.014,darkMetal,torso,0,.45,.39);
  box(.12,.025,.018,.01,led,torso,0,.36,.39);
  for(let i=0;i<4;i++)box(.19,.012,.01,.004,graphite,torso,0,.25-i*.032,.367);
  for(const side of [-1,1]) {
    const wing=new THREE.Group();wing.name=side<0?'LeftWing':'RightWing';wing.position.set(side*.51,.36,-.04);torso.add(wing);joints['wing'+side]=wing;
    cylinder(.11,.12,metal,wing,side*.015,0,0);
    const panel=box(.12,.54,.4,.07,shell,wing,side*.1,-.19,.03);panel.rotation.x=-.25;panel.rotation.z=side*.15;
    box(.126,.085,.22,.025,porcelain,wing,side*.1,-.39,.09);
    screw(wing,side*.17,-.1,.08);screw(wing,side*.17,-.28,.1);
  }
  box(.43,.27,.38,.06,graphite,torso,0,.4,-.45);
  for(let i=0;i<3;i++)box(.3,.025,.015,.006,darkMetal,torso,0,.35+i*.065,-.65);

  // Articulated S-neck; plates, chrome pins and an exposed cable loop.
  const neck=new THREE.Group();neck.name='Neck';neck.position.set(0,.77,-.1);torso.add(neck);joints.neck=neck;
  box(.4,.25,.4,.035,graphite,neck,0,.12,0);
  for(const side of [-1,1]) {
    box(.08,.45,.3,.04,metal,neck,side*.22,.35,.04).rotation.x=-.25;
    servo(neck,side*.23,.34,.04,.12,side);
    box(.075,.47,.28,.035,darkMetal,neck,side*.18,.7,.13).rotation.x=.24;
    servo(neck,side*.2,.79,.14,.125,side);
  }
  box(.33,.28,.33,.03,graphite,neck,0,.47,.1);
  box(.3,.2,.29,.025,graphite,neck,0,.81,.15);
  wire([[-.13,.05,-.17],[-.25,.33,-.24],[-.24,.6,-.1],[-.16,.87,.08]],.034,neck);
  wire([[.1,.08,-.19],[.2,.3,-.27],[.19,.64,-.11],[.13,.87,.08]],.023,neck,darkMetal);

  const head=new THREE.Group();head.name='Head';head.position.set(0,.96,.14);head.scale.setScalar(1.13);neck.add(head);joints.head=head;
  // Profile extruded across the head: a curved duck crown, not a sphere.
  const profile = new THREE.Shape();
  profile.moveTo(-.58,-.3);profile.lineTo(.6,-.3);profile.lineTo(.63,.02);
  profile.bezierCurveTo(.59,.37,.38,.55,.01,.55);
  profile.bezierCurveTo(-.38,.55,-.61,.31,-.61,-.02);profile.closePath();
  const headGeo=new THREE.ExtrudeGeometry(profile,{depth:1.07,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.055,bevelThickness:.045,curveSegments:24});
  headGeo.translate(0,0,-.535);headGeo.rotateY(Math.PI/2);
  mesh(headGeo,shell,head,0,.03,0);
  // Warm inset side cheeks and a contrasting raised crown spine.
  for(const side of [-1,1]) {
    const cheekGeo=new THREE.ExtrudeGeometry(profile,{depth:.026,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.025,bevelThickness:.015,curveSegments:24});
    cheekGeo.translate(0,0,-.013);cheekGeo.rotateY(Math.PI/2);
    const cheek=mesh(cheekGeo,porcelain,head,side*.59,.03,0);cheek.scale.set(1,.88,.9);
    // Each eye is a camera lens with a circular yellow bezel and glossy glass.
    cylinder(.253,.083,yellow,head,side*.636,.15,.035);
    cylinder(.175,.105,graphite,head,side*.658,.15,.035);
    cylinder(.132,.12,lensGlass,head,side*.675,.15,.035);
    cylinder(.08,.127,lens,head,side*.68,.15,.035);
    ball(.031,porcelain,head,side*.75,.205,.079,.35,1,1);
    ball(.013,porcelain,head,side*.75,.116,.012,.3,1,1);
    box(.02,.048,.09,.02,rubber,head,side*.625,.02,-.31);
    screw(head,side*.625,-.18,-.37,'x',.025);
    screw(head,side*.625,-.18,.38,'x',.025);
  }
  box(.12,.045,.57,.02,shell,head,0,.613,-.05);
  // Upper bill and hinged lower bill. Duck front is +Z.
  box(1.25,.115,.64,.05,orange,head,0,-.245,.66);
  box(1.14,.035,.52,.015,yellow,head,0,-.181,.69);
  box(1.06,.038,.43,.017,rubber,head,0,-.312,.66);
  const jaw=new THREE.Group();jaw.name='LowerBeak';jaw.position.set(0,-.34,.39);head.add(jaw);joints.jaw=jaw;
  box(1.15,.09,.58,.045,orange,jaw,0,-.022,.27);
  box(1.06,.04,.56,.018,yellow,jaw,0,-.073,.29);
  box(.99,.027,.43,.015,rubber,jaw,0,.034,.28);
  for(const side of [-1,1]) {
    cylinder(.082,.047,orange,head,side*.604,-.305,.39);
    screw(head,side*.634,-.305,.39,'x',.027);
    for(let i=0;i<3;i++)cylinder(.018,.008,rubber,head,side*.63,-.22+i*.048,.47);
  }
  // Small rear details make the silhouette work from every angle.
  box(.7,.25,.07,.06,graphite,head,0,-.03,-.62);
  for(let i=0;i<5;i++)box(.07,.1,.015,.012,darkMetal,head,-.22+i*.11,-.02,-.663);
  robot.rotation.y = -.18;

  // Soft studio platform and contact shadow. Export includes only the duck.
  const plinth=mesh(new THREE.CylinderGeometry(1.72,1.78,.105,100),material(0xe7ede0,.05,.8),scene,0,-.065,0);
  plinth.receiveShadow=true; plinth.castShadow=false;
  const floor=mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x3a513e,opacity:.065}),scene,0,-.125,0);floor.rotation.x=-Math.PI/2;floor.castShadow=false;
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;
  const ctx=shadowCanvas.getContext('2d');const gradient=ctx.createRadialGradient(64,64,5,64,64,64);gradient.addColorStop(0,'rgba(50,70,50,.23)');gradient.addColorStop(1,'rgba(50,70,50,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
  const contact=mesh(new THREE.PlaneGeometry(3.3,3),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}),scene,0,-.006,0);contact.rotation.x=-Math.PI/2;contact.castShadow=false;contact.receiveShadow=false;

  let mobile = false;
  function resetView() {
    const damping=controls.enableDamping;
    controls.enableDamping=false;controls.update();
    controls.target.set(0,2.15,0);
    camera.position.set(9.5,4.5,8.1);
    if(mobile) camera.position.set(9.1,4.2,8.8);
    controls.update();
    controls.enableDamping=damping;
  }
  function resize() {
    const rect=viewport.getBoundingClientRect();const wasMobile=mobile;mobile=innerWidth<=700;
    renderer.setSize(rect.width,rect.height);camera.aspect=rect.width/rect.height;
    camera.setViewOffset(rect.width,rect.height,mobile?0:rect.width*.13,0,rect.width,rect.height);
    camera.updateProjectionMatrix();if(wasMobile!==mobile)resetView();
  }
  resize();resetView();
  new ResizeObserver(resize).observe(viewport);

  const states={
    idle:['安静陪伴','我在这里，你慢慢来。',''],
    listen:['认真倾听','你说，我认真听。','嗯，你说。'],
    think:['歪头思考','让我换个角度想一想。','唔，让我想想…'],
    speak:['开口说话','鸭嘴随节奏开合，无音频播放。','我们一步一步来。'],
    greet:['打个招呼','很高兴见到你。','你好呀，我是小鸭！'],
    celebrate:['开心一下','这一小步，也值得开心。','这一步，你做到了！']
  };
  let action='idle',actionStart=0, elapsed=0,live=false,mouthSource=()=>0;
  const speech=document.querySelector('#speech');
  function setAction(value) {
    action=value;actionStart=elapsed;
    document.querySelector('#state-name').textContent=states[value][0];
    document.querySelector('#state-description').textContent=states[value][1];
    document.querySelector('#speech-text').textContent=states[value][2];
    speech.classList.toggle('show',Boolean(states[value][2]));
    document.querySelectorAll('[data-action]').forEach(b=>{const active=b.dataset.action===value;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  }
  document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>{live=false;setAction(b.dataset.action);}));
  const palettes={mint:[0x81d0cd,0xff791c,0xf4c33d,'薄荷青'],lavender:[0xb4a0d8,0xf3c83f,0x91d7d9,'雾紫'],cream:[0xe5d6b2,0xed862c,0xefc142,'奶油白'],graphite:[0x526779,0xf0c141,0xa7c9d4,'石墨蓝']};
  let palette='mint';
  document.querySelectorAll('[data-color]').forEach(b=>b.addEventListener('click',()=>{
    palette=b.dataset.color;const c=palettes[palette];shell.color.setHex(c[0]);orange.color.setHex(c[1]);yellow.color.setHex(c[2]);
    document.querySelector('#color-name').textContent=c[3];
    document.querySelectorAll('[data-color]').forEach(el=>{const active=el===b;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});
  }));
  document.querySelector('#reset').addEventListener('click',resetView);
  document.querySelector('#rotate').addEventListener('click',e=>{controls.autoRotate=!controls.autoRotate;e.currentTarget.setAttribute('aria-pressed',String(controls.autoRotate));});
  document.querySelector('#export').addEventListener('click',async e=>{
    const button=e.currentTarget;button.disabled=true;button.textContent='正在导出…';
    try {
      const {GLTFExporter}=await import('./vendor/GLTFExporter.js');
      const copy=robot.clone(true);copy.position.set(0,0,0);copy.rotation.set(0,0,0);
      // Export a neutral pose, independent of the current action.
      copy.getObjectByName('Body').position.y=1.93;copy.getObjectByName('Body').rotation.set(0,0,0);
      for(const name of ['Head','Neck','LowerBeak','LeftWing','RightWing'])copy.getObjectByName(name).rotation.set(0,0,0);
      const result=await new GLTFExporter().parseAsync(copy,{binary:true});
      const url=URL.createObjectURL(new Blob([result],{type:'model/gltf-binary'}));
      const a=document.createElement('a');a.href=url;a.download='study-duck-'+palette+'.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
    } catch(error){console.error(error);document.querySelector('#state-description').textContent='模型导出失败，请重试。';}
    finally{button.disabled=false;button.innerHTML='下载模型 <span>↗</span>';}
  });

  const clock=new THREE.Clock();
  let visible=true;document.addEventListener('visibilitychange',()=>{visible=!document.hidden;clock.getDelta();});
  function animate() {
    requestAnimationFrame(animate);const delta=Math.min(clock.getDelta(),.05);if(!visible)return;elapsed+=delta;
    const t=elapsed, a=t-actionStart;const damp=1-Math.exp(-delta*7);
    let headX=.025,headY=Math.sin(t*.43)*.045,headZ=Math.sin(t*.67)*.025,neckX=0,jaw=0,wingL=.05,wingR=-.05,bodyY=1.93,bodyX=0,bodyZ=0;
    if(!reducedMotion){
      bodyY+=Math.sin(t*1.7)*.012;
      if(action==='listen'){headZ=.16;headY=.16;headX=.09;neckX=.075;}
      if(action==='think'){headZ=-.27;headY=-.16+Math.sin(a*1.4)*.07;headX=-.07;}
      if(action==='speak'){jaw=live?Math.min(1,Math.max(0,mouthSource()))*.38:.08+Math.abs(Math.sin(a*9)*Math.sin(a*3.2))*.3;headX=Math.sin(a*2)*.045;headZ=Math.sin(a*1.3)*.065;}
      if(action==='greet'){wingR=-.95+Math.sin(a*7)*.28;headZ=.13;headY=.1;bodyZ=Math.sin(a*3)*.025;}
      if(action==='celebrate'){const bounce=Math.abs(Math.sin(a*4));bodyY+=bounce*.09;wingL=.5+Math.sin(a*8)*.15;wingR=-wingL;headX=-.12;bodyX=Math.sin(a*4)*.055;jaw=.15;}
    }
    torso.position.y=THREE.MathUtils.lerp(torso.position.y,bodyY,damp);
    torso.rotation.x=THREE.MathUtils.lerp(torso.rotation.x,bodyX,damp);torso.rotation.z=THREE.MathUtils.lerp(torso.rotation.z,bodyZ,damp);
    head.rotation.x=THREE.MathUtils.lerp(head.rotation.x,headX,damp);head.rotation.y=THREE.MathUtils.lerp(head.rotation.y,headY,damp);head.rotation.z=THREE.MathUtils.lerp(head.rotation.z,headZ,damp);
    neck.rotation.x=THREE.MathUtils.lerp(neck.rotation.x,neckX,damp);joints.jaw.rotation.x=THREE.MathUtils.lerp(joints.jaw.rotation.x,jaw,damp);
    joints['wing-1'].rotation.z=THREE.MathUtils.lerp(joints['wing-1'].rotation.z,wingL,damp);
    joints.wing1.rotation.z=THREE.MathUtils.lerp(joints.wing1.rotation.z,wingR,damp);
    controls.update();renderer.render(scene,camera);
  }
  // A small read-only inspection surface for model and interaction verification.
  window.duckPreview={setLiveState:(value,text='')=>{live=true;setAction(value);if(text){document.querySelector('#speech-text').textContent=text.slice(0,70);speech.classList.add('show');}},setMouthSource:fn=>{mouthSource=fn;},getState:()=>({action,palette,live,meshes:renderer.info.render.calls,triangles:renderer.info.render.triangles,headTilt:head.rotation.z,beakAngle:joints.jaw.rotation.x,autoRotate:controls.autoRotate,webgl:renderer.getContext().getParameter(renderer.getContext().VERSION)}),renderer,scene,robot,camera,controls};
  renderer.render(scene,camera);loading.hidden=true;document.body.dataset.ready='true';window.dispatchEvent(new Event('duck:ready'));animate();
}
