/* Layered DAG layout. Intermediate routing slots keep long edges out of node boxes. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GrowingPanoramaLayout=factory();})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  function visible(g,chapter,range='chapter',selected){
    if(range==='year')return new Set(g.order);
    const ids=new Set(chapter.nodes.map(n=>n.id));
    if(selected&&g.byId.has(selected))ids.add(selected);
    function walk(id){for(const e of g.pre.get(id))if(!ids.has(e.from)){ids.add(e.from);walk(e.from);}}
    [...ids].forEach(walk);return ids;
  }
  function layout(g,ids){
    const order=g.order.filter(id=>ids.has(id)),rank=new Map(),layers=[],vertices=new Map(),links=[];
    const W=184,H=76,GAP=22,ROW=142,PAD=38;
    for(const id of order){
      const r=Math.max(0,...g.pre.get(id).filter(e=>ids.has(e.from)).map(e=>rank.get(e.from)+1));
      rank.set(id,r);const v={id,rank:r,width:W,height:H,pre:[],next:[]};
      vertices.set(id,v);(layers[r]||(layers[r]=[])).push(v);
    }
    let serial=0;
    for(const e of g.data.edges.filter(e=>ids.has(e.from)&&ids.has(e.to))){
      const chain=[vertices.get(e.from)];
      for(let r=rank.get(e.from)+1;r<rank.get(e.to);r++){
        const v={id:'route-'+serial++,rank:r,width:8,height:H,pre:[],next:[],dummy:true};
        vertices.set(v.id,v);layers[r].push(v);chain.push(v);
      }
      chain.push(vertices.get(e.to));
      for(let i=1;i<chain.length;i++){chain[i-1].next.push(chain[i]);chain[i].pre.push(chain[i-1]);}
      links.push({...e,chain});
    }
    const place=()=>{for(const row of layers){let x=0;for(const v of row){v.x=x;v.center=x+v.width/2;x+=v.width+GAP;}row.span=Math.max(0,x-GAP);}};
    place();
    for(let pass=0;pass<6;pass++){
      for(const down of [true,false]){
        const rows=down?layers.slice(1):layers.slice(0,-1).reverse();
        for(const row of rows){
          const score=v=>{const ns=down?v.pre:v.next;return ns.length?ns.reduce((s,n)=>s+n.center/Math.max(1,layers[n.rank].span),0)/ns.length:v.center/Math.max(1,row.span);};
          const scores=new Map(row.map(v=>[v.id,score(v)]));
          row.sort((a,b)=>scores.get(a.id)-scores.get(b.id));place();
        }
      }
    }
    const width=Math.max(W,...layers.map(row=>row.span))+PAD*2,height=Math.max(H,layers.length?((layers.length-1)*ROW+H):H)+PAD*2;
    for(const row of layers)for(const v of row){v.x+=(width-row.span)/2;v.y=PAD+v.rank*ROW;v.center=v.x+v.width/2;}
    const edges=links.map(({chain,...e})=>{
      const source=chain[0],points=[{x:source.center,y:source.y+H}],commands=[`M${source.center},${source.y+H}`];
      for(let i=1;i<chain.length;i++){
        const v=chain[i],a=points.at(-1),b={x:v.center,y:v.y},mid=(a.y+b.y)/2;
        commands.push(`C${a.x},${mid} ${b.x},${mid} ${b.x},${b.y}`);points.push(b);
        if(v.dummy){commands.push(`L${v.center},${v.y+H}`);points.push({x:v.center,y:v.y+H});}
      }
      return {...e,path:commands.join(' '),points};
    });
    return {width,height,nodes:order.map(id=>{const v=vertices.get(id);return {id,x:v.x,y:v.y,width:W,height:H,rank:v.rank};}),edges};
  }
  return {visible,layout};
});
