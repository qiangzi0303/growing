// Render legacy notation without rewriting question IDs, answers or saved records.
export function radicalMath(value){
 const text=String(value??'');
 const superscripts={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-'};
 const symbols=/^(?:[A-Z]{1,4}|[abcdxyzmnptsvrhk]{1,3}|[a-z]|π)$/;
 const quantity=/^(?:总路程|总时间|总人数|总数|频数|对角线|两底和|路程差|路程|时间|速度|面积|底边|边长|高)/;
 const space=i=>{while(/[ \t]/.test(text[i]||'\n'))i++;return i;};
 const result=(end,latex,changed=false,body)=>({end,latex,changed,body});
 function atom(start,depth=0,powers=true){
  if(depth>24)return null;
  let i=space(start),v,sign=text[i];
  const blank=text.slice(i).match(/^(?:（[ \t　]*）|\([ \t　]*\))/);
  if(blank){
   v=result(i+blank[0].length,'(\\quad)');
  }else if('（([|'.includes(sign||'\0')){
   const inner=expression(i+1,depth+1),close={'(':')','（':'）','[':']','|':'|'}[sign];
   if(!inner||text[space(inner.end)]!==close)return null;
   v=sign==='|'?result(space(inner.end)+1,'\\lvert '+inner.latex+'\\rvert ',inner.changed):result(space(inner.end)+1,'('+inner.latex+')',inner.changed,inner.latex);
  }else if(sign==='√'||sign==='∛'){
   const inner=atom(i+1,depth+1,!['(','（'].includes(text[space(i+1)]));if(!inner)return null;
   v=result(inner.end,(sign==='∛'?'\\sqrt[3]':'\\sqrt')+'{'+(inner.body??inner.latex)+'}',true);
  }else if(sign==='Δ'){
   const inner=atom(i+1,depth+1,false);if(!inner)return null;
   v=result(inner.end,'\\Delta '+inner.latex,inner.changed);
  }else{
   const number=text.slice(i).match(/^(?:\d+(?:\.\d+)?|\.\d+)/);
   if(number)v=result(i+number[0].length,number[0]);
   else{
    const word=text.slice(i).match(/^[a-zA-Z]+|^π/);
    const label=text.slice(i).match(quantity);
    if(label)v=result(i+label[0].length,'\\text{'+label[0]+'}');
    else{
     if(!word||!symbols.test(word[0])||/[a-zA-Z]/.test(text[i-1]||''))return null;
     v=result(i+word[0].length,word[0]==='π'?'\\pi ':word[0]);
    }
   }
  }
  if(!powers)return v;
  const power=text.slice(v.end).match(/^[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/);
  if(power)v=result(v.end+power[0].length,v.latex+'^{'+[...power[0]].map(c=>superscripts[c]).join('')+'}',v.changed);
  else if(text[v.end]==='^'){
   const power=text.slice(v.end+1).match(/^[+-]?\d+|^[a-zA-Z](?![a-zA-Z])/);
   if(power)v=result(v.end+1+power[0].length,v.latex+'^{'+power[0]+'}',v.changed);
  }
  if(text[v.end]==='%')v=result(v.end+1,v.latex+'\\%',v.changed);
  if(text[v.end]==='°')v=result(v.end+1,v.latex+'^{\\circ}',v.changed);
  return v;
 }
 function product(start,depth){
  let v=atom(start,depth);if(!v)return null;
  while(true){
   const i=space(v.end),sign=text[i];
   if(sign==='/'||sign==='／'){
    let at=space(i+1),negative='';if(text[at]==='-'||text[at]==='−'){negative='-';at++;}
    const rhs=atom(at,depth);if(!rhs)break;
    v=result(rhs.end,'\\frac{'+(v.body??v.latex)+'}{'+negative+(rhs.body??rhs.latex)+'}',true);
   }else if(sign==='√'||sign==='∛'||/[a-zA-ZπΔ]/.test(sign||'')||sign==='('){
    const rhs=atom(i,depth);if(!rhs)break;
    v=result(rhs.end,v.latex+rhs.latex,v.changed||rhs.changed);
   }else break;
  }
  return v;
 }
 function expression(start,depth){
  let i=space(start),prefix='';if(['-','−','+'].includes(text[i])){prefix=text[i]==='+'?'+':'-';i++;}
  let v=product(i,depth);if(!v)return null;if(prefix)v=result(v.end,prefix+v.latex,v.changed);
  while(true){
   const i=space(v.end),op={'+':'+','-':'-','−':'-','×':'\\times ','*':'\\times ','÷':'\\div '}[text[i]];
   if(!op)break;const rhs=product(i+1,depth);if(!rhs)break;
   v=result(rhs.end,v.latex+op+rhs.latex,v.changed||rhs.changed);
  }
  return v;
 }
 let out='',i=0;
 while(i<text.length){
  const open=['\\(','\\[','$$','$'].find(s=>text.startsWith(s,i));
  if(open){const close=open==='\\('? '\\)':open==='\\['?'\\]':open,end=text.indexOf(close,i+open.length);if(end>=0){out+=text.slice(i,end+close.length);i=end+close.length;continue;}}
  const protectedText=text.slice(i).match(/^(?:https?:\/\/[^\s，。；]+|\d{4}\/\d{1,2}\/\d{1,2}(?!\d)|(?:km|cm|mm|m)\/(?:h|min|s)|and\/or)/);
  if(protectedText){out+=protectedText[0];i+=protectedText[0].length;continue;}
  const word=text.slice(i).match(/^[a-zA-Z]{2,}/);
  if(word&&!symbols.test(word[0])){out+=word[0];i+=word[0].length;continue;}
  const v=expression(i,0);
  if(v&&v.changed){out+='\\('+v.latex+'\\)';i=v.end;}else out+=text[i++];
 }
 return out;
}
export function courseMathHtml(value,formatter){
 const source=radicalMath(value);
 return formatter?formatter.html(source):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
