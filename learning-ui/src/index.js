import { createApp, h, shallowReactive } from 'vue';
import HomeSample from './HomeSample.vue';
import StudentHome from './StudentHome.vue';
import StudentCatalog from './StudentCatalog.vue';
import StudentSummary from './StudentSummary.vue';
import StudentResources from './StudentResources.vue';
import StudentEnglishCourse from './StudentEnglishCourse.vue';
import StudentMathCourse from './StudentMathCourse.vue';
import StudentKnowledge from './StudentKnowledge.vue';
import StudentHandwriting from './StudentHandwriting.vue';
import StudentEnglishLabs from './StudentEnglishLabs.vue';
import StudentMathResources from './StudentMathResources.vue';
import StudentMathLabs from './StudentMathLabs.vue';
import StudentPhysicsLabs from './StudentPhysicsLabs.vue';
import StudentTriangleCenters from './StudentTriangleCenters.vue';
import StudentFractionCourse from './StudentFractionCourse.vue';
import StudentUnit3Course from './StudentUnit3Course.vue';
import StudentPaperPages from './StudentPaperPages.vue';
import StudentPlatform from './StudentPlatform.vue';
import StudentPhotoReview from './StudentPhotoReview.vue';
import StudentMidterm from './StudentMidterm.vue';
import StudentDuckControl from './StudentDuckControl.vue';
import './style.css';
export function mount(target,adapter,options={}){
 const app=createApp(HomeSample,{adapter,...options});
 let instance;try{instance=app.mount(target);}catch(error){try{app.unmount();}catch{}throw error;}let destroyed=false;
 return {close(){if(!destroyed)instance.close();},openCalendar(){if(!destroyed)return instance.openCalendar();},isOpen(){return !destroyed&&instance.isOpen();},destroy(){if(destroyed)return;destroyed=true;instance.close();app.unmount();}};
}
export function mountStudent(target,page,model){
 const components={home:StudentHome,catalog:StudentCatalog,study:StudentCatalog,summary:StudentSummary,resources:StudentResources,'english-course':StudentEnglishCourse,'math-course':StudentMathCourse,knowledge:StudentKnowledge,handwriting:StudentHandwriting,'english-labs':StudentEnglishLabs,'math-resources-workbench':StudentMathResources,'math-labs':StudentMathLabs,'physics-labs':StudentPhysicsLabs,'triangle-centers':StudentTriangleCenters,'fraction-course':StudentFractionCourse,'unit3-course':StudentUnit3Course,midterm:StudentMidterm,'platform-auth':StudentPlatform,'platform-navigation':StudentPlatform,'platform-rankings':StudentPlatform,'photo-review':StudentPhotoReview,'paper-pages':StudentPaperPages};
 components['duck-control']=StudentDuckControl;
 const component=components[page];if(!component)throw Error('学习页面尚未迁移');
 const state=shallowReactive({model}),app=createApp({render:()=>h(component,state.model.controller?{controller:state.model.controller}:{model:state.model})});try{app.mount(target);}catch(error){try{app.unmount();}catch{}throw error;}let destroyed=false;
 return {update(value){if(!destroyed)state.model=value;},destroy(){if(!destroyed){destroyed=true;app.unmount();}}};
}
