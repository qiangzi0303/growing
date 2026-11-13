import * as THREE from 'three';
import {GLTFLoader} from './vendor/girl/addons/loaders/GLTFLoader.js';
import {OrbitControls} from './vendor/girl/addons/controls/OrbitControls.js';

const assets = new URL('./characters/girl/', import.meta.url);
const actions = new Set(['idle','listen','think','speak','greet','celebrate','walk']);

export async function createGirl(viewport, {compact=false, onReady=()=>{}, onError=()=>{}}={}) {
  const renderer = new THREE.WebGLRenderer({alpha:true, antialias:true, powerPreference:'low-power'});
  renderer.setClearColor(0, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, compact ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  viewport.append(renderer.domElement);
  const scene = new THREE.Scene(), modelRoot = new THREE.Group();
  scene.add(modelRoot);
  scene.add(new THREE.HemisphereLight(0xfff7f1, 0x867a89, 2.6));
  const light = new THREE.DirectionalLight(0xfff4ee, 3.1);
  light.position.set(2,4,5); scene.add(light);
  const fill = new THREE.DirectionalLight(0xe6edff, 1.4);
  fill.position.set(-3,2,1); scene.add(fill);
  const camera = new THREE.OrthographicCamera(-1.35,1.35,2.7,0,.01,30);
  camera.position.set(0,1.2,7); camera.lookAt(0,1.2,0);
  let controls;
  if (!compact) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan=false; controls.enableDamping=true;
    controls.target.set(0,1.2,0); controls.minZoom=.7; controls.maxZoom=2.5;
    controls.minPolarAngle=.4; controls.maxPolarAngle=Math.PI*.65;
  }
  const resize=()=>{
    const {width,height}=viewport.getBoundingClientRect();
    const aspect=width/Math.max(height,1), half=1.35;
    camera.left=-half*aspect; camera.right=half*aspect; camera.top=half; camera.bottom=-half;
    camera.updateProjectionMatrix(); renderer.setSize(Math.max(1,width),Math.max(1,height),false);
  };
  const observer=new ResizeObserver(resize); observer.observe(viewport); resize();
  const loader=new GLTFLoader(), bones={}, rest=new Map(), faces=[];
  let model, mixer, walkClip, walkAction, walkRequest, ready=false, disposed=false;
  let action='idle', started=0, elapsed=0, mouthSource=()=>0, mouth=0, blink=0, active=true, raf=0, previous=0, frameCount=0;
  let visible=!document.hidden;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const quaternion=new THREE.Quaternion(), axis=new THREE.Vector3();
  const turn=(name, direction, angle)=>{
    const bone=bones[name]; if(!bone)return;
    bone.parent.getWorldQuaternion(quaternion).invert();
    axis.copy(direction).applyQuaternion(quaternion);
    bone.quaternion.premultiply(quaternion.setFromAxisAngle(axis,angle));
    bone.updateWorldMatrix(false,true);
  };
  const xAxis=new THREE.Vector3(1,0,0),yAxis=new THREE.Vector3(0,1,0),zAxis=new THREE.Vector3(0,0,1);
  function aim(name, childName, direction) {
    const bone=bones[name], child=bones[childName]; if(!bone||!child)return;
    modelRoot.updateMatrixWorld(true);
    const current=child.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(new THREE.Vector3())).normalize();
    const desired=new THREE.Quaternion().setFromUnitVectors(current,direction.normalize()).multiply(bone.getWorldQuaternion(new THREE.Quaternion()));
    bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(desired));
    modelRoot.updateMatrixWorld(true);
  }
  async function loadWalk() {
    if(walkClip)return walkClip;
    if(!walkRequest)walkRequest=loader.loadAsync(new URL('girl1_walk.glb',assets).href).then(gltf=>{
      walkClip=gltf.animations.find(clip=>/walk/i.test(clip.name));
      release(gltf.scene);
      return walkClip;
    }).catch(error=>{walkRequest=null;throw error;});
    return walkRequest;
  }
  function release(root) {
    const resources=new Set(),images=new Set();
    root?.traverse(object=>{
      if(object.geometry)resources.add(object.geometry);
      if(object.skeleton)resources.add(object.skeleton);
      for(const material of (Array.isArray(object.material)?object.material:[object.material]).filter(Boolean)){
        resources.add(material);
        for(const value of Object.values(material))if(value?.isTexture){resources.add(value);if(value.source?.data?.close)images.add(value.source.data);}
      }
    });
    resources.forEach(resource=>resource.dispose()); images.forEach(image=>image.close());
  }
  function setLiveState(value) {
    if(!actions.has(value))return;
    if(action!==value){action=value;started=elapsed;walkAction?.stop();}
    if(value!=='speak')mouth=0;
    if(value==='walk'&&ready)loadWalk().then(clip=>{
      if(!disposed&&action==='walk'&&clip){walkAction=mixer.clipAction(clip);walkAction.reset().play();}
    }).catch(()=>{if(action==='walk')action='idle';});
  }
  const render=now=>{
    raf=0;
    if(disposed||!active||!visible)return;
    const interval=1000/(compact?24:30);
    if(now-previous<interval){raf=requestAnimationFrame(render);return;}
    const delta=Math.min((now-previous)/1000,.1);previous=now;elapsed+=delta;
    if(ready){
      const t=elapsed, a=t-started;
      if(action==='walk'&&walkAction&&!reduced.matches)mixer.update(delta);
      else{
        for(const [bone,pose] of rest){bone.quaternion.copy(pose.q);bone.position.copy(pose.p);bone.scale.copy(pose.s);}
        modelRoot.position.y=0;
        if(!reduced.matches){
          modelRoot.position.y=Math.sin(t*1.7)*.009;
          turn('Head',yAxis,Math.sin(t*.5)*.025);
          if(action==='listen'){turn('Head',zAxis,.1);turn('Head',xAxis,.045);}
          if(action==='think'){turn('Head',zAxis,-.13);turn('Head',yAxis,-.1);}
          if(action==='speak'){turn('Head',xAxis,Math.sin(a*2)*.035);turn('RightForeArm',xAxis,-.12-Math.sin(a*2.4)*.06);}
          if(action==='greet'){turn('RightArm',zAxis,-1.85);turn('RightForeArm',zAxis,-.4+Math.sin(a*7)*.2);}
          if(action==='celebrate'){modelRoot.position.y+=Math.abs(Math.sin(a*4))*.045;turn('LeftArm',zAxis,.35);turn('RightArm',zAxis,-.35);}
        }
      }
      if((action==='greet'||action==='celebrate')&&elapsed-started>3.2)setLiveState('idle');
      const target=action==='speak'?THREE.MathUtils.clamp(Number(mouthSource())||0,0,1):0;
      mouth=THREE.MathUtils.lerp(mouth,target,1-Math.exp(-delta*20));
      const blinkTime=t%5.2;
      blink=reduced.matches?0:blinkTime<.12?blinkTime/.12:blinkTime<.28?1-(blinkTime-.12)/.16:0;
      for(const face of faces){
        const map=face.morphTargetDictionary,weights=face.morphTargetInfluences;
        weights[map.blinkLeft]=blink;weights[map.blinkRight]=blink;weights[map.mouthOpen]=mouth;
      }
    }
    controls?.update();renderer.render(scene,camera);frameCount++;
    raf=requestAnimationFrame(render);
  };
  function wake(){if(!disposed&&active&&visible&&!raf){previous=performance.now();raf=requestAnimationFrame(render);}}
  function pause(){cancelAnimationFrame(raf);raf=0;}
  const visibility=()=>{visible=!document.hidden;if(visible)wake();else pause();};
  document.addEventListener('visibilitychange',visibility);
  const api={
    setLiveState,
    setMouthSource(fn){mouthSource=typeof fn==='function'?fn:()=>0;},
    setActive(value){active=!!value;if(active)wake();else{mouth=0;pause();}},
    reset(){camera.position.set(0,1.2,7);camera.zoom=1;camera.updateProjectionMatrix();controls?.target.set(0,1.2,0);controls?.update();},
    getState:()=>({character:'girl',ready,action,mouth,blink,frames:frameCount,active:active&&visible,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,pixelRatio:renderer.getPixelRatio(),bones:Object.keys(bones).length,facialRig:faces.length>0}),
    renderer,scene,camera,controls,
    dispose(){disposed=true;pause();observer.disconnect();document.removeEventListener('visibilitychange',visibility);mixer?.stopAllAction();if(model)mixer?.uncacheRoot(model);controls?.dispose();release(model);renderer.dispose();renderer.domElement.remove();}
  };
  wake();
  try{
    const gltf=await loader.loadAsync(new URL('girl1_face.glb',assets).href);
    if(disposed){release(gltf.scene);return api;}
    model=gltf.scene;modelRoot.add(model);model.rotation.y-=Math.PI/2;
    const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
    model.scale.multiplyScalar(2.4/size.y);model.updateMatrixWorld(true);
    bounds.setFromObject(model);const center=bounds.getCenter(new THREE.Vector3());
    model.position.add(new THREE.Vector3(-center.x,-bounds.min.y,-center.z));
    model.traverse(object=>{if(object.isBone)bones[object.name.replace(/^mixamorig:?/,'')]=object;if(object.isSkinnedMesh)object.frustumCulled=false;if(['blinkLeft','blinkRight','mouthOpen'].every(name=>Number.isInteger(object.morphTargetDictionary?.[name])))faces.push(object);});
    modelRoot.updateMatrixWorld(true);
    aim('LeftArm','LeftForeArm',new THREE.Vector3(.23,-1,.04));
    aim('RightArm','RightForeArm',new THREE.Vector3(-.23,-1,.04));
    for(const bone of Object.values(bones))rest.set(bone,{q:bone.quaternion.clone(),p:bone.position.clone(),s:bone.scale.clone()});
    mixer=new THREE.AnimationMixer(model);ready=true;api.model=model;
    if(action==='walk')setLiveState('walk');
    await renderer.compileAsync(scene,camera);
    await new Promise(requestAnimationFrame);
    renderer.render(scene,camera);onReady(api);
  }catch(error){api.dispose();onError(error);throw error;}
  return api;
}
