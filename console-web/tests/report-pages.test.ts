import { beforeEach, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { reactive } from 'vue';
import { NCollapseItem, NDataTable, NPagination, NSelect } from 'naive-ui';
import type { VueWrapper } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import StudySummary from '@/features/reports/components/study-summary.vue';
import GrowthChart from '@/features/reports/components/growth-chart.vue';
import UnitReports from '@/features/reports/components/unit-reports.vue';
import ReportPanel from '@/features/reports/components/report-panel.vue';
import StudentOverview from '@/features/students/components/student-overview.vue';
import ReportsPage from '@/views/reports/index.vue';
import { growthValues, formatDuration, formatBeijing, getGrowth } from '@/features/reports/api';
import type { RewardReport } from '@/features/students/api';

const mocks = vi.hoisted(() => ({ api: vi.fn(), update: vi.fn(), detail: vi.fn(), list: vi.fn() }));
const auth = reactive({ profile: { id: 'p', role: 'Parent' }, sessionRevision: 0 });
vi.mock('@/store/modules/auth', () => ({ useAuthStore: () => auth }));
vi.mock('@/service/request', () => ({ api: mocks.api }));
vi.mock('@/features/students/api', async original => ({ ...await original<object>(), getStudentDetail: mocks.detail, listStudents: mocks.list }));
vi.mock('@/hooks/common/echarts', async () => {
  const { shallowRef } = await import('vue');
  return { useEcharts: () => ({ domRef: shallowRef(null), updateOptions: mocks.update }) };
});
const growth = { timezone: 'Asia/Shanghai', note: '缺少快照保持空值', points: [
  { day: '2026-11-04', subjects: [{ subject: '数学', minutes: 0, read: null, mastered: null, practice: null }] },
  { day: '2026-11-05', subjects: [{ subject: '数学', minutes: 8, read: 2, mastered: 1, practice: 3 }] }
] };
const report = { subjects: [{ subject: '数学', read: 2, mastered: 1, practice: 3, todayMinutes: 8, activeMinutes: 9, totalMinutes: 99, dailyMinutes: {} }], today: '2026-11-05', timezone: 'Asia/Shanghai', lastSyncedAt: '2026-11-04T18:00:00Z', timeNote: '保留历史时长', note: '', warnings: [] };
const unit = { id: 'math-upper-1', title: '三角形', subject: 'math', subjectName: '数学', term: 'upper', termName: '八年级上册', activeMinutes: null, firstStudyDay: null, lastStudyDay: null, studyDays: 0, mastered: 1, total: 4, masteryPercent: 25, concept: { passed: 1, total: 2, retainedAttempts: 1, best: 8, latest: 7 }, practice: { done: 0, total: 2 }, diagnostic: { passed: 0, shaky: 0, weak: 0, tested: 0, total: 2 }, handwriting: { graded: 1, latest: { score: 100, needsReview: false, at: '2026-11-04T18:00:00Z' } } };
const units = { units: [unit], lastSyncedAt: null, warnings: [], note: '课程达标独立计算' };
const emptyRewards: RewardReport = { entries: [], summaries: [], invalid: 0, confirmations: [], note: '' };
async function selectValue(page: VueWrapper, label: string, value: string | number) {
  const select = page.findAllComponents(NSelect).find(item => item.attributes('aria-label') === label);
  expect(select, `Naive select ${label}`).toBeDefined();
  select!.vm.$emit('update:value', value); await flushPromises();
}
it('uses Naive data tables and disclosure controls while retaining report values', () => {
  const summary = mount(StudySummary, { props: { report } });
  expect(summary.findComponent(NDataTable).exists()).toBe(true);
  expect(summary.text()).toContain('99 分钟'); summary.unmount();
  const chart = mount(GrowthChart, { props: { report: growth, days: 7 } });
  expect(chart.findAllComponents(NSelect)).toHaveLength(3);
  expect(chart.findComponent(NCollapseItem).exists()).toBe(true); chart.unmount();
});
it('shows word mastery and sentence completion independently in the shared parent/admin unit report', () => {
  const page = mount(UnitReports, { props: { report: { ...units, units: [{ ...unit, subject: 'english', words: { mastered: 2, total: 52 }, sentences: { completed: 3, total: 40 } }] } } });
  const cells = page.findAll('tbody td');
  expect(page.text()).toContain('单词掌握'); expect(page.text()).toContain('句子互动');
  expect(cells[2].text()).toBe('2 / 52 个'); expect(cells[3].text()).toBe('3 / 40 项完成');
  expect(page.text()).toContain('25%'); page.unmount();
});
beforeEach(() => { vi.clearAllMocks(); auth.profile = { id: 'p', role: 'Parent' }; auth.sessionRevision++; mocks.api.mockResolvedValue(units); });
it('retains null snapshot gaps and genuine zero minutes, formatting Beijing time', () => {
  expect(growthValues(growth, '数学', 'mastered')).toEqual([null, 1]);
  expect(growthValues(growth, '数学', 'minutes')).toEqual([0, 8]);
  expect(formatDuration(null)).toBe('暂无时间记录');
  expect(formatBeijing('2026-11-04T18:00:00Z')).toContain('2026/11/5');
});
it('shows retained study-time totals rather than reconstructing from course mastery', () => {
  const page = mount(StudySummary, { props: { report } });
  expect(page.text()).toContain('99 分钟'); expect(page.text()).toContain('保留历史时长'); page.unmount();
});
it('changes chart subject and metric locally and emits supported day windows', async () => {
  const page = mount(GrowthChart, { props: { report: growth, days: 7 } });
  await page.get('.n-collapse-item__header-main').trigger('click');
  expect(page.get('[data-testid="growth-values"]').text()).toContain('0');
  await selectValue(page, '曲线指标', 'mastered');
  expect(page.get('[data-testid="growth-values"]').text()).toContain('暂无快照');
  expect(mocks.update.mock.lastCall?.[0]()).toMatchObject({ series: [{ data: [null, 1], connectNulls: false }] });
  await selectValue(page, '曲线学科', '英语');
  expect(page.get('[data-testid="growth-values"]').text()).not.toContain('8 分钟');
  for (const days of [30, 90, 7]) await selectValue(page, '曲线天数', days);
  expect(page.emitted('update:days')).toEqual([[30], [90], [7]]); page.unmount();
});
it('uses the existing admin report contract for growth and validates supported windows before I/O', async () => {
  mocks.api.mockResolvedValue({ growth });
  expect(await getGrowth('Admin', 'a/b', 90)).toEqual(growth);
  expect(mocks.api).toHaveBeenCalledWith('/admin/students/a%2Fb/report?days=90', expect.anything());
  await expect(getGrowth('Parent', 'a', 8)).rejects.toThrow('报告天数');
  expect(mocks.api).toHaveBeenCalledTimes(1);
});
it('filters units without requests and keeps unknown duration and handwriting semantics', async () => {
  const page = mount(UnitReports, { props: { report: units } });
  expect(page.text()).toContain('暂无时间记录'); expect(page.text()).not.toContain('0 分钟');
  expect(page.text()).toContain('25%'); expect(page.text()).toContain('不直接计入课程达标');
  expect(page.text()).toContain('未测');
  await selectValue(page, '单元学科', 'english'); expect(page.text()).toContain('该筛选下暂无已学习单元');
  await selectValue(page, '单元学科', 'math');
  await selectValue(page, '单元册次', 'lower'); expect(page.text()).not.toContain('三角形');
  expect(mocks.api).not.toHaveBeenCalled(); page.unmount();
});
it('distinguishes an empty unit report', () => {
  const page = mount(UnitReports, { props: { report: { ...units, units: [] } } });
  expect(page.text()).toContain('尚无单元学习记录');
  expect(page.text()).toContain('已完成课程达标的单元 0 / 0'); page.unmount();
});
it('counts fully mastered units across the report independently of local filters', async () => {
  const page = mount(UnitReports, { props: { report: { ...units, units: [unit, { ...unit, id: 'done', mastered: 4, masteryPercent: 100 }] } } });
  expect(page.text()).toContain('已完成课程达标的单元 1 / 2');
  await selectValue(page, '单元学科', 'english');
  expect(page.text()).toContain('已完成课程达标的单元 1 / 2'); page.unmount();
});
it('labels concept scores out of ten and preserves retained best versus unknown scores', async () => {
  const page = mount(UnitReports, { props: { report: units } });
  expect(page.text()).toContain('最近 7/10 · 最好 8/10');
  await page.setProps({ report: { ...units, units: [{ ...unit, concept: { ...unit.concept, latest: null, best: 8 } }] } });
  expect(page.text()).toContain('留存最好 8/10'); expect(page.text()).not.toContain('最近 0/10');
  await page.setProps({ report: { ...units, units: [{ ...unit, concept: { ...unit.concept, latest: null, best: null } }] } });
  const conceptCell = page.findAll('tbody td').find(cell => cell.text().includes('项通过'))!;
  expect(conceptCell.text()).toContain('按历史达标记录'); expect(conceptCell.text()).not.toContain('0/10');
  await page.setProps({ report: { ...units, units: [{ ...unit, concept: { ...unit.concept, passed: 0, latest: null, best: null } }] } });
  expect(page.text()).toContain('暂无有效评分'); page.unmount();
});
it('loads units separately; changes days without reloading units or summary', async () => {
  const page = mount(ReportPanel, { props: { student: { id: 'a', displayName: '安' }, report, growth } }); await flushPromises();
  expect(mocks.api).toHaveBeenCalledWith('/parent/children/a/unit-report', expect.anything());
  mocks.api.mockResolvedValueOnce(growth);
  await selectValue(page, '曲线天数', 30); await flushPromises();
  expect(mocks.api.mock.lastCall?.[0]).toBe('/parent/children/a/growth?days=30');
  expect(mocks.api).toHaveBeenCalledTimes(2); expect(page.text()).toContain('99 分钟');
  await page.get('[data-testid="refresh-units"]').trigger('click'); await flushPromises();
  expect(mocks.api.mock.lastCall?.[0]).toBe('/parent/children/a/unit-report'); page.unmount();
});
it('cancels previous students and clears data on permission changes, ignoring late responses', async () => {
  let resolve!: (value: unknown) => void;
  mocks.api.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  const page = mount(ReportPanel, { props: { student: { id: 'a', displayName: '安' }, report, growth } }); await flushPromises();
  const signal = mocks.api.mock.calls[0][1].signal as AbortSignal;
  await page.setProps({ student: { id: 'b', displayName: '北' } }); await flushPromises();
  expect(signal.aborted).toBe(true);
  auth.sessionRevision++; await flushPromises(); resolve(units); await flushPromises();
  expect(page.text()).not.toContain('三角形'); expect(page.text()).not.toContain('99 分钟'); page.unmount();
});
it('shows permission errors rather than an empty report and retries', async () => {
  mocks.api.mockRejectedValueOnce(new Error('无权访问孩子'));
  const page = mount(ReportPanel, { props: { student: { id: 'a', displayName: '安' }, report, growth } }); await flushPromises();
  expect(page.text()).toContain('无权访问孩子'); expect(page.text()).not.toContain('尚无单元学习记录');
  await page.get('[data-testid="retry-units"]').trigger('click'); await flushPromises(); expect(page.text()).toContain('三角形'); page.unmount();
});
it('integrates reports into the shared exact-child detail without replacing pending rewards', async () => {
  mocks.list.mockResolvedValue({ rows: [{ id: 'a', displayName: '安' }], total: 1 });
  mocks.detail.mockResolvedValue({ student: { id: 'a', displayName: '安' }, report, growth, rewards: { ...emptyRewards, entries: [{ documentKey: 'math-upper-1', unit: '三角形', hash: 'reward-a', kind: 'game', amount: 5, claimedParent: '', claimedAt: '', confirmation: null }] } satisfies RewardReport });
  const page = mount(StudentOverview, { props: { studentId: 'a' }, global: { stubs: { RouterLink: true } } });
  await flushPromises(); expect(page.text()).toContain('成长曲线'); expect(page.text()).toContain('三角形');
  expect(page.text()).toContain('待确认奖励'); page.unmount();
});
it('supports admin report selection with real search and server pagination', async () => {
  auth.profile.role = 'Admin';
  mocks.list.mockResolvedValue({ rows: [{ id: 'a', displayName: '安' }], total: 21, page: 1, pageSize: 20 });
  mocks.detail.mockResolvedValue({ student: { id: 'a', displayName: '安' }, report, growth, rewards: emptyRewards });
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/reports', component: ReportsPage }] });
  await router.push('/reports');
  const page = mount(ReportsPage, { global: { plugins: [router] } }); await flushPromises();
  expect(page.get('input').attributes('aria-label')).toBe('姓名或账号');
  expect(page.get('input').attributes('id')).toBe('report-search');
  await page.get('input').setValue('安'); await page.get('form').trigger('submit'); await flushPromises();
  expect(mocks.list.mock.lastCall?.[1]).toMatchObject({ q: '安', page: 1 });
  page.getComponent(NPagination).vm.$emit('update:page', 2); await flushPromises();
  expect(mocks.list.mock.lastCall?.[1]).toMatchObject({ q: '安', page: 2 });
  const select = page.findAll('button').find(button => button.text() === '查看报告')!;
  await select.trigger('click'); await flushPromises();
  expect(router.currentRoute.value.query.student).toBe('a'); expect(page.text()).toContain('成长曲线'); page.unmount();
});
it('rapid day-window changes cancel old requests and do not revive late results after unmount', async () => {
  const page = mount(ReportPanel, { props: { student: { id: 'a', displayName: '安' }, report, growth } }); await flushPromises();
  let resolve!: (value: unknown) => void;
  mocks.api.mockImplementationOnce(() => new Promise(done => { resolve = done; })).mockResolvedValueOnce({ ...growth, points: [] });
  await selectValue(page, '曲线天数', 30);
  const signal = mocks.api.mock.lastCall?.[1].signal as AbortSignal;
  await selectValue(page, '曲线天数', 90); await flushPromises();
  expect(signal.aborted).toBe(true); expect(page.text()).toContain('暂无成长快照');
  resolve(growth); await flushPromises(); expect(page.text()).toContain('暂无成长快照');
  page.unmount();
});
it('keeps a parent child picker on a bookmarked report and never falls back for an unbound target', async () => {
  mocks.list.mockResolvedValue({ rows: [{ id: 'a', displayName: '安' }, { id: 'b', displayName: '北' }] });
  mocks.detail.mockImplementation((_role, student) => Promise.resolve({ student, report, growth, rewards: emptyRewards }));
  const page = mount(StudentOverview, { props: { studentId: 'a', showReports: true }, global: { stubs: { RouterLink: true } } });
  await flushPromises(); page.findAllComponents(NSelect)[0].vm.$emit('update:value', 'b'); await flushPromises();
  expect(mocks.detail.mock.lastCall?.[1].id).toBe('b'); expect(page.text()).toContain('北的学习概况');
  mocks.detail.mockClear(); await page.setProps({ studentId: 'unbound' }); await flushPromises();
  expect(page.text()).toContain('未绑定'); expect(mocks.detail).not.toHaveBeenCalled(); page.unmount();
});
