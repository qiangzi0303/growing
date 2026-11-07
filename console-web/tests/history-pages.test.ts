import { beforeEach, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { reactive } from 'vue';
import { NSelect, NPagination, NDataTable, NCollapse } from 'naive-ui';
import WorkHistory from '@/features/history/components/work-history.vue';
import AttemptHistory from '@/features/history/components/attempt-history.vue';
import StudentRankings from '@/features/history/components/student-rankings.vue';
import HistoryPanel from '@/features/history/components/history-panel.vue';
const mocks=vi.hoisted(()=>({api:vi.fn()}));
const auth=reactive({profile:{id:'p',role:'Parent'},sessionRevision:0});
vi.mock('@/store/modules/auth',()=>({useAuthStore:()=>auth}));
vi.mock('@/service/request',()=>({api:mocks.api}));
const student={id:'a',displayName:'安'};
const original={revision:2,prompt:'<img src=x onerror=alert(1)>',pages:[[{tool:'pen',width:4,points:[[10,10,1],[30,40,1]]}]],photos:[],grades:[{revision:1,at:'2026-11-01T00:00:00Z',score:40,feedback:'旧点评',needsReview:false},{revision:2,at:'2026-11-02T00:00:00Z',score:null,feedback:'<script>bad</script>',needsReview:true}]};
const grades=[{id:'g1',revision:1,at:'2026-11-01T00:00:00Z',studentAnswer:'第一次',result:{verdict:'partial',feedback:'漏负号',answerPages:['data:image/png;base64,first']}},{id:'g2',revision:1,at:'2026-11-02T00:00:00Z',studentAnswer:'第二次',result:{verdict:'correct',feedback:'正确',answerPages:['data:image/png;base64,second']}}];
beforeEach(()=>{vi.clearAllMocks();auth.profile={id:'p',role:'Parent'};auth.sessionRevision++;vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({clearRect:vi.fn(),beginPath:vi.fn(),arc:vi.fn(),fill:vi.fn(),moveTo:vi.fn(),lineTo:vi.fn(),stroke:vi.fn()} as any);});
it('fetches paginated summaries first; only opens current manuscript canvas on demand and preserves all dated grades',async()=>{
 mocks.api.mockImplementation((path:string)=>path.includes('key=')?Promise.resolve({original}):Promise.resolve({rows:[{key:'hw:a',title:'作业',pages:1,updatedAt:'2026-11-02T00:00:00Z'}],total:11,page:1,pageSize:10}));
 const page=mount(WorkHistory,{props:{student}});await flushPromises();
 expect(mocks.api).toHaveBeenCalledTimes(1);expect(page.find('canvas').exists()).toBe(false);
 await page.get('[data-testid="open-handwriting"]').trigger('click');await flushPromises();
 expect(mocks.api.mock.lastCall?.[0]).toBe('/parent/children/a/handwriting?key=hw%3Aa');
 expect(page.get('canvas').attributes('width')).toBe('800');expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();
 expect(page.text()).toContain('旧点评');expect(page.text()).toContain('需要复核');expect(page.text()).toContain('2026/11/1');expect(page.text()).toContain('未保存旧版本笔迹快照');
 expect(page.text()).toContain('<script>bad</script>');expect(page.find('script').exists()).toBe(false);expect(page.find('img[src=x]').exists()).toBe(false);
 page.getComponent(NPagination).vm.$emit('update:page',2);await flushPromises();expect(mocks.api.mock.lastCall?.[0]).toContain('page=2');expect(page.find('canvas').exists()).toBe(false);page.unmount();
});
it('loads photo history by read-only discovery, selecting each grade keeps its own answer image and date',async()=>{
 mocks.api.mockImplementation((path:string)=>Promise.resolve(path.includes('/review?')?{question:{id:'q',number:'28',text:'题面',grades},followups:[]}:{rows:[{id:'q',number:'28',title:'分式',gradeCount:2,latestAt:grades[1].at}],total:1,page:1,pageSize:20}));
 const page=mount(WorkHistory,{props:{student}});await flushPromises();page.findAllComponents(NSelect)[0].vm.$emit('update:value','photo');await flushPromises();
 expect(mocks.api.mock.lastCall?.[0]).toBe('/question-bank/unit-wrong-history?studentId=a&page=1');
 expect(page.find('img').exists()).toBe(false);await page.get('[data-testid="open-photo"]').trigger('click');await flushPromises();
 expect(page.get('img').attributes('src')).toBe(grades[1].result.answerPages[0]);expect(page.text()).toContain('第二次');
 page.findAllComponents(NSelect)[1].vm.$emit('update:value','g1');await flushPromises();
 expect(page.get('img').attributes('src')).toBe(grades[0].result.answerPages[0]);expect(page.text()).toContain('第一次');expect(page.text()).toContain('漏负号');expect(page.text()).toContain('2026/11/1');
 expect(mocks.api.mock.calls.every((call:any[])=>!call[1]?.method)).toBe(true);page.unmount();
});
it('clears originals and aborts/ignores late data when switching student or losing session',async()=>{
 let resolve!:(value:unknown)=>void;
 mocks.api.mockResolvedValueOnce({rows:[{key:'k',title:'A作业'}],total:1,page:1,pageSize:10}).mockImplementationOnce(()=>new Promise(r=>{resolve=r;})).mockResolvedValue({rows:[],total:0,page:1,pageSize:10});
 const page=mount(WorkHistory,{props:{student}});await flushPromises();await page.get('[data-testid="open-handwriting"]').trigger('click');const signal=mocks.api.mock.lastCall?.[1].signal;
 await page.setProps({student:{id:'b',displayName:'白'}});await flushPromises();expect(signal.aborted).toBe(true);resolve({original});await flushPromises();expect(page.find('canvas').exists()).toBe(false);expect(page.text()).not.toContain('旧点评');
 auth.sessionRevision++;await flushPromises();expect(page.text()).toBe('');page.unmount();
});
it('does not turn a denied manuscript response into an empty history and allows retry',async()=>{
 mocks.api.mockRejectedValueOnce(Error('没有访问权限')).mockResolvedValue({rows:[],total:0,page:1,pageSize:10});
 const page=mount(WorkHistory,{props:{student}});await flushPromises();expect(page.text()).toContain('没有访问权限');expect(page.text()).not.toContain('尚无作业记录');await page.get('[data-testid="retry-work"]').trigger('click');await flushPromises();expect(page.text()).toContain('尚无作业记录');page.unmount();
});
it('retains repeated wrong counts and real recent 0/1 attempts, without inventing answer text',async()=>{
 mocks.api.mockImplementation((path:string)=>Promise.resolve(path.includes('/attempts?')?{rows:[{attemptId:'x',correct:0,at:'2026-11-05T00:00:00Z'},{attemptId:'y',correct:1,at:'2026-11-04T00:00:00Z'}],totalCount:2,wrongCount:1,correctCount:1,page:1,pageSize:20}:{rows:[{kind:'math',questionId:'q',title:'分式',wrongCount:3,correctCount:1,totalCount:4,lastAt:'2026-11-05T00:00:00Z'}],total:1,page:1,pageSize:20}));
 const page=mount(AttemptHistory,{props:{student}});await flushPromises();expect(page.text()).toContain('错 3 次');await page.get('[data-testid="open-attempts"]').trigger('click');await flushPromises();
 expect(mocks.api.mock.lastCall?.[0]).toBe('/question-bank/attempts?studentId=a&kind=math&questionId=q&page=1');expect(page.text()).toContain('作答错误');expect(page.text()).toContain('作答正确');expect(page.text()).toContain('不含作答原文');page.unmount();
});
it('reads rankings for the exact student and board, displays anonymous peers and own tied rank',async()=>{
 const board={id:'m1',title:'分式',subject:'math',term:'lower',kind:'unit',score:70,participants:3};
 mocks.api.mockImplementation((path:string)=>Promise.resolve(path.includes('board=')?{board,rows:[{rank:1,label:'同学乙',score:80,isSelf:false,conceptPercent:80,testPercent:90,diagnosisPercent:70},{rank:2,label:'我',score:70,isSelf:true}],self:{rank:2,label:'我',score:70,conceptPercent:70,testPercent:80,diagnosisPercent:60,updatedAt:'2026-11-05T00:00:00Z'},total:2,page:1,pageSize:20}:{boards:[board],formula:'30% + 40% + 30%',note:'同分并列'}));
 const page=mount(StudentRankings,{props:{student}});await flushPromises();expect(mocks.api.mock.calls.map(c=>c[0])).toEqual(['/parent/children/a/rankings','/parent/children/a/rankings?board=m1&page=1']);expect(page.text()).toContain('同学乙');expect(page.text()).toContain('我的名次：2');expect(page.text()).toContain('同分并列');
 expect(page.text()).toContain('费曼评测');expect(page.text()).toContain('80.0%');expect(page.text()).toContain('最近计分');
 expect(page.getComponent(NDataTable).props('scrollX')).toBe(720);
 page.findAllComponents(NSelect)[0].vm.$emit('update:value','english');await flushPromises();expect(page.text()).toContain('暂无对应的已学习课程');expect(page.text()).not.toContain('同学乙');page.unmount();
});
it('keeps heavy history collapsed until explicitly requested and clears the panel for the next child',async()=>{
 mocks.api.mockImplementation((path:string)=>Promise.resolve(path.endsWith('/rankings')?{boards:[],formula:'',note:''}:{rows:[],total:0,page:1,pageSize:10}));
 const page=mount(HistoryPanel,{props:{student}});await flushPromises();expect(mocks.api).not.toHaveBeenCalled();await page.get('[data-testid="open-history"]').trigger('click');await flushPromises();expect(mocks.api).toHaveBeenCalledTimes(3);expect(page.text()).toContain('反复错题');await page.setProps({student:{id:'b',displayName:'白'}});await flushPromises();expect(page.text()).not.toContain('反复错题');expect(mocks.api).toHaveBeenCalledTimes(3);page.unmount();
});
it('aborts stale ranking results for another child and hides them after role or account changes',async()=>{
 let late!:(value:unknown)=>void;const board={id:'m1',title:'分式',subject:'math',term:'lower',kind:'unit',score:70,participants:3};
 mocks.api.mockResolvedValueOnce({boards:[board],formula:'',note:''}).mockImplementationOnce(()=>new Promise(resolve=>{late=resolve;})).mockResolvedValue({boards:[],formula:'',note:''});
 const page=mount(StudentRankings,{props:{student}});await flushPromises();const signal=mocks.api.mock.calls[1][1].signal;
 await page.setProps({student:{id:'b',displayName:'白'}});await flushPromises();expect(signal.aborted).toBe(true);expect(mocks.api.mock.lastCall?.[0]).toBe('/parent/children/b/rankings');
 late({board,rows:[{rank:1,label:'旧学生',score:99}],self:{rank:1,score:99},total:1,page:1,pageSize:20});await flushPromises();expect(page.text()).not.toContain('旧学生');
 auth.profile={id:'other',role:'Admin'};await flushPromises();expect(page.text()).toBe('');page.unmount();
});

it('uses the ranking pagination to request the selected board page and marks only the own row',async()=>{
 const board={id:'m1',title:'分式',subject:'math',term:'lower',kind:'unit',score:0,participants:21};
 mocks.api.mockImplementation((path:string)=>Promise.resolve(path.includes('board=')?{board,rows:[{rank:1,label:'我',score:0,isSelf:true}],self:{rank:1,label:'我',score:0},total:21,page:1,pageSize:20}:{boards:[board],formula:'',note:''}));
 const page=mount(StudentRankings,{props:{student}});await flushPromises();
 expect(page.find('tr[aria-current="true"]').text()).toContain('0.00');
 page.getComponent(NPagination).vm.$emit('update:page',2);await flushPromises();
 expect(mocks.api.mock.lastCall?.[0]).toBe('/parent/children/a/rankings?board=m1&page=2');page.unmount();
});

it('opens recognition and knowledge disclosures with Naive collapse while keeping manuscript content intact',async()=>{
 const saved={...original,recognition:{text:'已核对的文字',confirmed:true},grades:[{...original.grades[0],knowledge:[{nodeId:'m1',score:0,feedback:'需要巩固'}]}]};
 mocks.api.mockImplementation((path:string)=>Promise.resolve(path.includes('key=')?{original:saved}:{rows:[{key:'k',title:'作业',pages:1}],total:1,page:1,pageSize:10}));
 const page=mount(WorkHistory,{props:{student}});await flushPromises();await page.get('[data-testid="open-handwriting"]').trigger('click');await flushPromises();
 expect(page.findAllComponents(NCollapse)).toHaveLength(2);
 const headers=page.findAll('.n-collapse-item__header-main');await headers[0].trigger('click');await headers[1].trigger('click');await flushPromises();
 expect(page.text()).toContain('已核对的文字');expect(page.text()).toContain('m1 · 0/100 · 需要巩固');expect(page.get('canvas').attributes('height')).toBe('1100');page.unmount();
});
