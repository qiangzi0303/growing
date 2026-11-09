/* Presentation hooks for the two original classrooms. */
document.addEventListener('DOMContentLoaded',()=>{
  const tools=document.querySelector('.course-quick-tools');
  const tabs=document.querySelector('.legacy-course-header .tabs');
  if(tools&&tabs)tabs.after(tools);
});
document.addEventListener('click',event=>{
  const action=event.target.closest('.legacy-more button');
  if(action)action.closest('details').open=false;
});
