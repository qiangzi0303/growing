// Progress belongs to the application, never to inferred model memory or mastery records.
export class LessonSession {
  constructor(){this.course=null;this.index=0;this.phase='idle';this.version=0;}
  load(input){
    if(!input||typeof input.id!=='string'||!Array.isArray(input.segments))return false;
    const segments=input.segments.filter(s=>typeof s==='string'&&s.trim()).slice(0,30).map(s=>s.slice(0,1800));
    const course={id:input.id.slice(0,200),title:String(input.title||'当前课程').slice(0,200),subject:String(input.subject||'').slice(0,30),mode:input.mode==='exam'?'exam':'learn',segments:input.mode==='exam'?[]:segments};
    const changed=JSON.stringify(this.course)!==JSON.stringify(course);
    if(changed){this.course=course;this.index=0;this.phase='idle';++this.version;}
    return changed;
  }
  begin(){if(!this.course?.segments.length||this.course.mode==='exam')throw Error('请先在图文讲解页面选择课程。测验期间不提供讲课或答案。');if(this.index>=this.course.segments.length)this.index=0;this.phase='teaching';return this.current();}
  pause(){if(this.phase==='teaching')this.phase='paused';}
  question(){this.pause();this.phase='question';}
  complete(){if(this.phase!=='teaching')return false;++this.index;this.phase=this.index>=this.course.segments.length?'finished':'between';return true;}
  current(){return this.course?.segments[this.index]||'';}
  snapshot(){return {courseId:this.course?.id||'',title:this.course?.title||'',mode:this.course?.mode||'learn',index:this.index,total:this.course?.segments.length||0,phase:this.phase,version:this.version};}
  context(){return JSON.stringify({course:this.course,segmentIndex:this.index+1,currentSegment:this.current(),phase:this.phase});}
}
