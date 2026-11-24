// Convert only unambiguous legacy radicals; saved course/answer text is unchanged.
export function radicalMath(value){
 const text=String(value??'');
 const tex=s=>s.replace(/−/g,'-').replace(/×/g,'\\times ').replace(/÷/g,'\\div ').replace(/²/g,'^{2}').replace(/³/g,'^{3}').replace(/π/g,'\\pi ');
 function rootAt(start){
  const sign=text[start];if(sign!=='√'&&sign!=='∛')return null;
  let end=start+1,body='';
  if(text[end]==='('){
   let depth=1;const begin=++end;
   while(end<text.length&&depth){if(text[end]==='(')depth++;if(text[end]===')')depth--;if(depth)end++;}
   if(depth)return null;
   body=text.slice(begin,end++);
   if(!/^[\da-zA-Zπ+−\-*/().²³×÷\s]+$/.test(body))return null;
  }else{
   const match=text.slice(end).match(/^(?:\d+(?:\.\d+)?|[a-zA-Zπ])(?:[²³])?/);
   if(!match)return null;body=match[0];end+=body.length;
  }
  return {end,latex:(sign==='∛'?'\\sqrt[3]':'\\sqrt')+'{'+tex(body)+'}'};
 }
 let out='',i=0;
 while(i<text.length){
  const open=['\\(','\\[','$$','$'].find(s=>text.startsWith(s,i));
  if(open){const close=open==='\\('? '\\)':open==='\\['?'\\]':open,end=text.indexOf(close,i+open.length);if(end>=0){out+=text.slice(i,end+close.length);i=end+close.length;continue;}}
  const reciprocal=text.startsWith('1/',i)&&!/[\da-zA-Z.]/.test(text[i-1]||''),r=rootAt(i+(reciprocal?2:0));
  if(r){out+='\\('+(reciprocal?'\\frac{1}{'+r.latex+'}':r.latex)+'\\)';i=r.end;}else out+=text[i++];
 }
 return out;
}
export function courseMathHtml(value,formatter){
 const source=radicalMath(value);
 return formatter?formatter.html(source):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
