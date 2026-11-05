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
  function questionHtml(source){
    // Diagram metadata is appended for processing, not part of the student-facing question.
    return html(String(source??'').replace(/\s*图示条件\s*[：:][\s\S]*$/,'').trim());
  }
  function solutionHtml(source){
    // Split prose only: a multiline formula must stay intact, escaped and validated.
    let tokens;try{tokens=validate(source);}catch(e){return html(source);}
    const blocks=[[]];
    for(const p of tokens){
      if(p.math){blocks.at(-1).push(p);continue;}
      for(const [i,text] of p.text.split(/(\r?\n[ \t]*\r?\n)/).entries()){
        if(i%2)blocks.push([]);else if(text)blocks.at(-1).push({text});
      }
    }
    const label=/^\s*(?:#{1,6}\s*)?(?:\*\*)?(?:【)?(错误原因|关键步骤|最终答案|结论|答案|因为|所以|∵|∴)(?:】)?(?:\*\*)?[：:，, \t]*/;
    const prose=text=>escape(text.replace(/(^|[，。；：;:\n]\s*)(?:\*\*)?(因为|所以)(?:\*\*)?[：:，,]?/g,(_,before,word)=>before+(word==='因为'?'∵':'∴')));
    return blocks.map((block,i)=>{
      const first=block[0]?.text||'',match=first.match(label);
      if(match&&first.slice(match[0].length).trim()===''&&block.length===1){
        let next=i+1;while(next<blocks.length&&!blocks[next].length)next++;
        if(next<blocks.length){block.push({text:'\n'},...blocks[next]);blocks[next]=[];}
      }
      if(!block.length)return '';
      const kind=!match?'':match[1]==='因为'||match[1]==='∵'?'reason':match[1]==='关键步骤'?'key':match[1]==='错误原因'?'error':'conclusion';
      const body=block.map(p=>p.math?`<span class="${p.display?'math-display':'math-inline'}">${formula(p)}</span>`:prose(p.text)).join('');
      return `<div class="solution-step${kind?' solution-'+kind:''}">${body}</div>`;
    }).join('');
  }
  const solutionPrompt='证明中的“因为”写作 ∵，“所以”写作 ∴。关键构造或推导以“【关键步骤】”开头，最终结论以“【结论】”开头，分别独立成段，保留推理依据；不要输出 HTML 或用颜色命令标记公式。';
  return {version,parts,validate,normalize,html,questionHtml,solutionHtml,solutionPrompt};
});
