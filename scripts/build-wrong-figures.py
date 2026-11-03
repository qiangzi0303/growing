"""Reviewed vector figures for 1025141010.pdf. Coordinates encode givens, never answers."""
from pathlib import Path
import math,json
ROOT=Path(__file__).resolve().parents[1]
WEB=ROOT/'app/src/main/assets/web/app-design'
def add(a,b):return (a[0]+b[0],a[1]+b[1])
def sub(a,b):return (a[0]-b[0],a[1]-b[1])
def mul(a,s):return (a[0]*s,a[1]*s)
def length(a):return math.hypot(*a)
def unit(a):return mul(a,1/length(a))
def mix(a,b,t):return add(a,mul(sub(b,a),t))
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def intersect(a,b,c,d):return add(a,mul(sub(b,a),cross(sub(c,a),sub(d,c))/cross(sub(b,a),sub(d,c))))
def foot(p,a,b):
 v=sub(b,a);return add(a,mul(v,sum(x*y for x,y in zip(sub(p,a),v))/sum(x*x for x in v)))
def bisector(o,a,b):return add(o,add(unit(sub(a,o)),unit(sub(b,o))))
def xy(p):return f'{p[0]:.2f},{p[1]:.2f}'
class Figure:
 def __init__(self,title,w=520,h=340):self.title=title;self.w=w;self.h=h;self.items=[]
 def line(self,a,b,dash=False):self.items.append(f'<path d="M {xy(a)} L {xy(b)}"'+(' stroke-dasharray="6 5"' if dash else '')+'/>')
 def triangle(self,a,b,c,dash=False):
  for p,q in [(a,b),(b,c),(c,a)]:self.line(p,q,dash)
 def text(self,p,text,size=19):self.items.append(f'<text x="{p[0]:.2f}" y="{p[1]:.2f}" font-size="{size}">{text}</text>')
 def labels(self,points,offsets=None):
  for name,p in points.items():self.text(add(p,(offsets or {}).get(name,(-8,-12))),name)
 def right(self,o,a,b):
  u=mul(unit(sub(a,o)),11);v=mul(unit(sub(b,o)),11)
  self.items.append(f'<path d="M {xy(add(o,u))} L {xy(add(add(o,u),v))} L {xy(add(o,v))}"/>')
 def tick(self,a,b,n=1):
  u=unit(sub(b,a));v=mul((-u[1],u[0]),5)
  for i in range(n):
   p=add(mix(a,b,.5),mul(u,(i-(n-1)/2)*5));self.line(sub(p,v),add(p,v))
 def angle(self,o,a,b,r=25,n=1):
  start=math.atan2(a[1]-o[1],a[0]-o[0]);end=math.atan2(b[1]-o[1],b[0]-o[0]);delta=(end-start+math.pi)%(2*math.pi)-math.pi
  for i in range(n):
   rr=r+i*5;p=add(o,(rr*math.cos(start),rr*math.sin(start)));q=add(o,(rr*math.cos(start+delta),rr*math.sin(start+delta)))
   self.items.append(f'<path d="M {xy(p)} A {rr} {rr} 0 0 {1 if delta>0 else 0} {xy(q)}"/>')
 def svg(self):return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" role="img" aria-label="{self.title}"><title>{self.title}</title><rect width="100%" height="100%" fill="white"/><g fill="none" stroke="#263d3b" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">'+''.join(self.items).replace('<text ','<text fill="#182d2c" stroke="none" font-family="Georgia, Times New Roman, serif" text-anchor="middle" ' )+'</g></svg>'
figures={}
def store(n,f,source='redrawn'):
 figures[f'1025141010-{n:02}']={'svg':f.svg(),'kind':source,'caption':('按原资料可见图形重绘；保留题设点位与标记。' if source=='original' else '依据题干条件补画示意图；原资料未保留完整附图。')+' 图形不按实际尺寸绘制。'}

# 1: CD is the internal bisector; D lies on AB and E on BC.
f=Figure('第1题：角平分线与垂线');A=(100,55);B=(55,280);C=(450,280)
D=mix(A,B,length(sub(C,A))/(length(sub(C,A))+length(sub(C,B))));E=foot(D,B,C)
f.triangle(A,B,C);f.line(C,D);f.line(D,E);f.right(E,D,C);f.angle(C,B,D);f.angle(C,D,A)
f.labels(dict(A=A,B=B,C=C,D=D,E=E),{'B':(-15,20),'C':(12,20),'D':(-19,-4),'E':(0,23)})
f.text(mix(D,E,.5),'4');f.text((260,308),'9');store(1,f)

f=Figure('第2题：AC中点D与中线BD');A=(260,45);B=(120,280);C=(400,280);D=mix(A,C,.5)
f.triangle(A,B,C);f.line(B,D);f.tick(A,B);f.tick(A,C);f.tick(A,D,2);f.tick(D,C,2);f.labels(dict(A=A,B=B,C=C,D=D),{'B':(-12,23),'C':(12,23),'D':(20,0)});store(2,f,'original')
f=Figure('第3题：中线AD');A=(230,55);B=(80,280);C=(420,280);D=mix(B,C,.5)
f.triangle(A,B,C);f.line(A,D);f.tick(B,D);f.tick(D,C);f.labels(dict(A=A,B=B,C=C,D=D),{'B':(-12,22),'C':(12,22),'D':(0,24)});f.text((130,155),'4');f.text((340,150),'3');store(3,f)
f=Figure('第4题：三个小区的位置');A=(300,65);B=(95,270);C=(425,270);f.triangle(A,B,C,True);f.labels(dict(A=A,B=B,C=C),{'B':(-15,22),'C':(12,22)});store(4,f,'original')

f=Figure('第5条原题6与原题7：全等与旋转',920,345)
A=(150,60);B=(45,270);C=(290,270);D=(310,60);E=(415,270);F=(170,270);M=intersect(A,C,D,F)
assert all(math.isclose(length(sub(p,q)),length(sub(r,s))) for p,q,r,s in [(A,B,D,E),(A,C,D,F),(B,C,E,F)])
f.triangle(A,B,C);f.triangle(D,E,F);f.labels(dict(A=A,B=B,C=C,D=D,E=E,F=F,M=M),{k:(0,23) for k in ['B','C','E','F']});f.text((230,320),'原题6',16)
# Exact clockwise 45 degree rotation about B; A,B,E are collinear.
B=(740,260);A=(560,260);angle=math.radians(-45);t=180*math.sin(math.radians(20))/math.sin(math.radians(25))
C=add(B,(t*math.cos(angle),t*math.sin(angle)))
def rotate(p):
 x,y=sub(p,B);return add(B,((x-y)/math.sqrt(2),(x+y)/math.sqrt(2)))
D=rotate(A);E=rotate(C);M=intersect(B,C,D,E)
assert abs(cross(sub(A,B),sub(E,B)))<1e-6
assert math.isclose(math.degrees(math.acos(sum(x*y for x,y in zip(unit(sub(B,A)),unit(sub(C,A)))))),20)
f.triangle(A,B,C);f.triangle(D,B,E);f.labels(dict(A=A,B=B,C=C,D=D,E=E,M=M),{'A':(-12,23),'B':(-12,23),'C':(12,-6),'D':(-10,-12),'E':(12,23),'M':(15,-9)});f.angle(A,B,C);f.text((610,247),'20°',16);f.text((740,320),'原题7',16);store(5,f,'original')
f=Figure('第6题：高AD与不等边');A=(325,55);B=(70,280);C=(430,280);D=(325,280)
f.triangle(A,B,C);f.line(A,D);f.right(D,A,C);f.labels(dict(A=A,B=B,C=C,D=D),{'B':(-12,22),'C':(12,22),'D':(0,24)});store(6,f,'original')

f=Figure('第14题：BP平分角B，AP垂直BP');B=(60,280);A=(260,130);C=(435,280);P=foot(A,B,bisector(B,A,C))
f.triangle(A,B,C);f.line(B,P);f.line(A,P);f.line(C,P);f.right(P,A,B);f.angle(B,A,P);f.angle(B,P,C);f.labels(dict(A=A,B=B,C=C,P=P),{'B':(-12,22),'C':(12,22),'P':(20,-5)});store(14,f)
f=Figure('第16题：角平分线AD与BC中点E');B=(50,280);C=(470,280);x=(240**2-420**2+420**2)/(2*420);A=(50+x,280-math.sqrt(240**2-x**2));D=mix(B,C,4/11);E=mix(B,C,.5)
f.triangle(A,B,C);f.line(A,D);f.line(A,E);f.tick(B,E,2);f.tick(E,C,2);f.angle(A,B,D);f.angle(A,D,C);f.labels(dict(A=A,B=B,C=C,D=D,E=E),{'B':(-12,22),'C':(12,22),'D':(-8,23),'E':(8,23)});f.text((87,162),'4');f.text((335,153),'7');store(16,f)

f=Figure('第18题：角的两边与外角平分线MP、NP');O=(55,275);M=(245,115);N=(265,275);A=(315,56);B=(465,275)
P=intersect(M,bisector(M,A,N),N,bisector(N,M,B))
f.line(O,A);f.line(O,B);f.line(M,N);f.line(M,P);f.line(N,P);f.line(O,P);f.angle(M,A,P,24);f.angle(M,P,N,24);f.angle(N,M,P,24,2);f.angle(N,P,B,24,2);f.labels(dict(O=O,M=M,N=N,A=A,B=B,P=P),{'O':(-12,23),'N':(0,23),'B':(0,23),'P':(16,5)});store(18,f,'original')

f=Figure('第19题：原资料主图与备用图轮廓',760,300)
for x,title in [(25,'原图轮廓'),(270,'备用图1'),(515,'备用图2、3')]:
 A=(x+20,235);B=(x+210,235);C=(x+118,55);f.triangle(A,B,C);f.labels(dict(A=A,B=B,C=C),{'A':(-10,20),'B':(12,20)});f.text((x+115,285),title,15)
store(19,f,'original');figures['1025141010-19']['caption']='按原资料保留三角形方向与备用图轮廓；缺失的运动起点、路线和边长未补写。'

f=Figure('第21题：AC垂直平分线与动点');A=(260,35);B=(180,275);C=(340,275);E=mix(A,C,.5)
v=sub(C,A);F=intersect(A,B,E,add(E,(-v[1],v[0])));M=mix(E,F,.55);D=mix(B,C,.35)
f.triangle(A,B,C);f.line(E,F);f.line(C,M);f.line(M,D);f.right(E,A,F);f.tick(A,E,2);f.tick(E,C,2);f.tick(A,B);f.tick(A,C);f.labels(dict(A=A,B=B,C=C,D=D,E=E,F=F,M=M),{'B':(-12,23),'C':(12,23),'D':(0,23),'E':(20,0),'F':(-20,0),'M':(0,-15)});store(21,f)

f=Figure('第22题：内角平分线交点O与平行线EF');A=(220,40);B=(65,280);C=(450,280)
a=length(sub(B,C));b=length(sub(A,C));c=length(sub(A,B));O=mul(add(add(mul(A,a),mul(B,b)),mul(C,c)),1/(a+b+c))
E=intersect(A,B,O,add(O,(1,0)));F=intersect(A,C,O,add(O,(1,0)));D=foot(O,A,C)
f.triangle(A,B,C)
for p,q in [(B,O),(C,O),(E,F),(O,D)]:f.line(p,q)
f.right(D,O,A);f.angle(B,A,O);f.angle(B,O,C);f.angle(C,B,O,27,2);f.angle(C,O,A,27,2);f.labels(dict(A=A,B=B,C=C,D=D,E=E,F=F,O=O),{'B':(-12,23),'C':(12,23),'D':(20,-6),'E':(-20,0),'F':(21,13),'O':(0,24)});store(22,f)

f=Figure('第25题：等腰直角三角形与延长线');A=(65,275);C=(350,275);B=(350,-10)
# Choose right triangle orientation with B above C; scale to keep D and M in view.
A=(70,275);C=(300,275);B=(300,45);E=intersect(B,C,A,bisector(A,B,C));D=foot(B,A,E);M=foot(D,A,C)
f.triangle(A,B,C);f.line(A,D);f.line(B,D);f.line(D,M);f.line(C,M,True);f.line(C,D);f.right(C,A,B);f.right(D,A,B);f.right(M,A,D);f.tick(A,C);f.tick(B,C);f.angle(A,B,E);f.angle(A,E,C);f.labels(dict(A=A,B=B,C=C,D=D,E=E,M=M),{'A':(-12,22),'C':(0,24),'E':(-17,-7),'D':(18,-7),'M':(15,24)});store(25,f)

f=Figure('第27题：积等三角形的三幅原图',960,365)
A=(190,90);B=(55,295);C=(270,295);P=(160,295);f.triangle(A,B,C);f.line(A,P);f.labels(dict(A=A,B=B,C=C,P=P),{'B':(-12,22),'C':(12,22),'P':(0,22)});f.text((165,350),'图1',17)
A=(400,160);B=(350,295);C=(620,295);D=(485,295);f.triangle(A,B,C);f.line(A,D);f.labels(dict(A=A,B=B,C=C,D=D),{'B':(-12,22),'C':(12,22),'D':(0,22)});f.text((485,350),'图2',17)
A=(790,210);B=(700,300);C=(880,300);D=(940,240);E=add(A,(-sub(D,A)[1],sub(D,A)[0]));E=(E[0],E[1])
# Rotate AD toward the upper-left (screen coordinates), preserving AD=AE.
E=add(A,(sub(D,A)[1],-sub(D,A)[0]));N=(850,330);M=(960,220)
assert math.isclose(length(sub(A,D)),length(sub(A,E)))
assert abs(sum(x*y for x,y in zip(sub(D,A),sub(E,A))))<1e-6
assert cross(sub(D,A),sub(B,A))*cross(sub(D,A),sub(E,A))<0
f.triangle(A,B,C);f.triangle(A,D,E);f.line(B,E);f.line(N,M);f.right(A,B,C);f.right(A,D,E);f.right(C,A,D);f.labels(dict(A=A,B=B,C=C,D=D,E=E,M=M,N=N),{'A':(-13,-10),'B':(-12,20),'C':(5,22),'D':(8,22),'E':(0,-12),'M':(-4,-15),'N':(-16,0)});f.text((810,350),'图3',17);store(27,f,'original')

# Keep the source subfigures separate so their labels remain legible on phones.
for n,regions in {5:[(0,460),(460,460)],19:[(0,255),(255,250),(505,255)],27:[(0,320),(320,330),(650,330)]}.items():
 row=figures[f'1025141010-{n:02}'];original=row['svg'];h=345 if n==5 else 300 if n==19 else 365
 old=f'viewBox="0 0 {920 if n==5 else 760 if n==19 else 960} {h}"'
 row['svgs']=[original.replace(old,f'viewBox="{x} 0 {w} {h}"') for x,w in regions]
target=WEB/'math-wrong-questions-data.js';text=target.read_text(encoding='utf-8');marker='/* BEGIN REVIEWED SVG FIGURES */'
if marker in text:text=text[:text.index(marker)].rstrip()+'\n'
text+='\n'+marker+'\nwindow.GrowingMathWrongFigures='+json.dumps(figures,ensure_ascii=False,separators=(',',':'))+';\n'
target.write_text(text,encoding='utf-8',newline='\n')
print(json.dumps({'questions':len(figures),'sourceRedraws':sum(v['kind']=='original' for v in figures.values()),'conditionBased':sum(v['kind']=='redrawn' for v in figures.values()),'unrecoverable':[15]},ensure_ascii=False))
