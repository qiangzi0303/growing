/* Shared, offline math text format. All prose is escaped; KaTeX never trusts input HTML. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../cloudflare/node_modules/katex'));
  else root.GrowingMathFormat=factory(root.katex);
})(typeof globalThis!=='undefined'?globalThis:this,katex=>{
  'use strict';
  const version='math-text-v1';
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const settings={throwOnError:true,trust:false,strict:'ignore',maxExpand:500,maxSize:20,output:'htmlAndMathml'};
  function parts(value){
    const source=String(value??''),result=[];let start=0,i=0;
    const push=end=>{if(end>start)result.push({text:source.slice(start,end)});};
    while(i<source.length){
      if(source.slice(i,i+2)==='\\$'){i+=2;continue;}
      let open='',close='',display=false;
      if(source.slice(i,i+2)==='\\('){open='\\(';close='\\)';}
      else if(source.slice(i,i+2)==='\\['){open='\\[';close='\\]';display=true;}
      else if(source.slice(i,i+2)==='$$'){open=close='$$';display=true;}
      else if(source[i]==='$'){open=close='$';}
      if(!open){if(['\\)','\\]'].includes(source.slice(i,i+2)))throw Error('公式结束符前缺少开始符。');i++;continue;}
      let end=i+open.length;
      while(end<source.length){if(source.slice(end,end+close.length)===close&&(end===0||source[end-1]!=='\\'))break;end++;}
      if(end>=source.length)throw Error('公式未闭合，请使用 \\(…\\) 或 \\[…\\]。');
      push(i);const formula=source.slice(i+open.length,end).trim();
      if(!formula)throw Error('公式不能为空。');
      result.push({math:formula,display});i=end+close.length;start=i;
    }
    push(source.length);return result;
  }
  function formula(part){
    if(/\\(?:href|url|includegraphics|html\w*|def|gdef|edef|xdef|newcommand|renewcommand|providecommand|global|let)\b/.test(part.math))throw Error('公式包含不支持的链接、图片或自定义命令。');
    if(!katex)throw Error('数学排版资源未加载，请刷新重试。');
    return katex.renderToString(part.math,{...settings,displayMode:part.display,macros:{}});
  }
  function validate(source){
    if(typeof source!=='string'||/data:image|<\s*(?:img|svg|iframe)\b|!\[[^\]]*\]\(/i.test(source))throw Error('题目应为文字和数学公式，不能用图片代替题面。');
    const tokens=parts(source);for(const part of tokens)if(part.math)formula(part);return tokens;
  }
  function normalize(source){
    const tokens=validate(source);
    for(const p of tokens)if(p.text&&(/[=<>√∛²³⁰¹⁴⁵⁶⁷⁸⁹₀-₉≠≤≥∠△⊥∥]/.test(p.text)||/[\da-zA-Z)]\s*[\^×÷±]\s*|\b(?:\d+(?:\.\d+)?|[a-zA-Z])\s*\/\s*(?:(?:\d+(?:\.\d+)?|[a-zA-Z])\b|\()/.test(p.text)))throw Error('请把数学表达式放在 \\(…\\) 中；分式请用 \\frac{分子}{分母}。');
    return tokens.map(p=>p.math?(p.display?'\\['+p.math+'\\]':'\\('+p.math+'\\)'):p.text).join('');
  }
  function html(source){
    try{return validate(source).map(p=>p.math?`<span class="${p.display?'math-display':'math-inline'}">${formula(p)}</span>`:escape(p.text)).join('');}
    catch(e){return `<span class="math-format-error">公式待核对：${escape(e.message)}</span><span class="math-source">${escape(source)}</span>`;}
  }
  return {version,parts,validate,normalize,html};
});
