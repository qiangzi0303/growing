/* Reviewed geometry links shared by archived questions and exam explanations. */
(()=>{
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Reviewed against each question's actual conditions, rather than matched by keywords.
// Entries describe the scope: a supporting method is not an additional given condition.
const geometryModels={
 '1025141010-01':[[10,'角平分线四种构造','基础方法：角平分线等距性质；原题缺图，须先核对点位。']],
 '1025141010-14':[[16,'雨伞模型','方法关联：角平分线与垂直条件；原题缺图，不能直接套用面积结论。']],
 '1025141010-18':[[10,'角平分线四种构造','对应第（1）问：用到两边等距证明角平分线。']],
 '1025141010-21':[[17,'将军饮马：两定一动','方法关联：把C关于AC的垂直平分线反射为A，再求最短路径；D也可移动，需另检查垂足与允许范围。']],
 '1025141010-22':[[10,'角平分线四种构造','对应等距性质及“平行造等腰”变式。'],[11,'双角平分线三种交角','直接对应结论②的内角平分线交点求角。']],
 '1025141010-25':[[16,'雨伞模型','对应AE平分顶角且BD垂直AE的构造；原题缺图，延长线位置需核对。'],[10,'角平分线四种构造','方法关联：角平分线的等距、全等与对称构造。']],
 '1025141010-27':[[42,'婆罗摩笈多变式','仅第（3）问：共顶点的两个等腰直角三角形，利用旋转比较面积；须核对摆放方向，不代表待比较三角形全等。']],
 'midterm-20261029-08':[[16,'雨伞模型','对应角平分线与垂直条件构造全等，再比较面积。']],
 'midterm-20261029-11':[[10,'角平分线四种构造','对应到角两边等距，再结合垂线段最短；最优垂足须在射线上。']],
 'midterm-20261029-13':[[25,'梯子模型','仅关联斜边中点等距这一基础步骤；本题不使用梯子模型的最值结论。']],
 'midterm-20261029-14':[[10,'角平分线四种构造','对应等距性质及直角三角形全等，另结合BC的垂直平分线。']],
 'midterm-20261029-15':[[38,'两垂一圆','对应直角在A、B、P三处的分类；圆上的点也可用勾股定理核对。']],
 'midterm-20261029-22':[[11,'双角平分线三种交角','直接对应第（1）问；第（2）问还需结合题中角度证明等腰。']],
 'midterm-20261029-24':[[10,'角平分线四种构造','仅第（3）问：在AC上截取AF=AB，利用SAS全等与等腰关系证明线段和。']]
};
function markup(q){
 const models=geometryModels[q.id];if(!models)return '';
 return `<section class="wrong-models" aria-label="对应几何模型"><h4>对应几何模型</h4><ul>${models.map(([id,title,note])=>`<li><a data-geometry-model="${id}" href="geometry-models.html#model-${id}">${id}号 · ${esc(title)} →</a><p>${esc(note)}</p></li>`).join('')}</ul></section>`;
}
window.GrowingGeometryLinks={markup,models:q=>(geometryModels[q.id]||[]).map(([id,title,note])=>({id,title,note,href:'geometry-models.html#model-'+id}))};
})();
