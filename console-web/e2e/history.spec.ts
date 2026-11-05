import { loginPost } from './fixtures/login-pacing';
import { expect, test } from '@playwright/test';
import { password, users } from './fixtures/local-users';
import { beijingDay } from './fixtures/window-data';

const manuscriptKey = 'growing-handwriting-v1:13000000-0000-4000-8000-000000000101';
const question = '13000000-0000-4000-8000-000000000102';
const child = users.childA.id;
test.beforeEach(async ({ request }) => {
  expect((await loginPost(request, { headers: { 'X-Growing-Client': '1' }, data: { username: users.parentA.username, password } })).status()).toBe(200);
});

test('history API: current manuscript strokes and all revision feedback stay separate from summary', async ({ request }) => {
  const list = await request.get(`/api/parent/children/${child}/handwriting`);
  expect(list.status()).toBe(200);
  const summary = await list.json();
  expect(summary.rows.some((row: { key: string }) => row.key === manuscriptKey)).toBe(true);
  expect(JSON.stringify(summary).includes('"points"')).toBe(false);
  const detail = await request.get(`/api/parent/children/${child}/handwriting?key=${encodeURIComponent(manuscriptKey)}`);
  expect(detail.status()).toBe(200);
  const { original } = await detail.json();
  expect(original.revision).toBe(2);
  expect(original.pages[0][0].points.length).toBe(3);
  expect(original.grades.map((grade: { revision: number }) => grade.revision)).toEqual([1, 2]);
  expect(original.grades.map((grade: { score: number | null }) => grade.score)).toEqual([45, null]);
});

test('history API: unit photo discovery is small and two grading attempts retain their own answer image', async ({ request }) => {
  const response = await request.get(`/api/question-bank/unit-wrong-history?studentId=${child}`);
  expect(response.status()).toBe(200);
  const summary = await response.json();
  expect(summary.rows.some((row: { id: string; gradeCount: number }) => row.id === question && row.gradeCount === 2)).toBe(true);
  expect(JSON.stringify(summary).includes('data:image')).toBe(false);
  const detail = await request.get(`/api/question-bank/questions/${question}/review?studentId=${child}`);
  expect(detail.status()).toBe(200);
  const { question: saved } = await detail.json();
  expect(saved.grades.length).toBe(2);
  const images = saved.grades.map((grade: { result: { answerPages: string[] } }) => grade.result.answerPages[0]);
  // Boolean checks deliberately prevent encoded image payloads entering failure logs.
  expect(images.every((image: string) => image.startsWith('data:image/png;base64,'))).toBe(true);
  expect(images[0] !== images[1]).toBe(true);
  expect(saved.grades.map((grade: { result: { verdict: string } }) => grade.result.verdict)).toEqual(['partial', 'correct']);
});

test('history API: repeated attempts, anonymous tied ranking and independent learning minutes exist', async ({ request }) => {
  const repeated = await (await request.get(`/api/question-bank/repeated?studentId=${child}`)).json();
  expect(repeated.rows.some((row: { questionId: string; wrongCount: number }) => row.questionId === question && row.wrongCount === 2)).toBe(true);
  const attempts = await (await request.get(`/api/question-bank/attempts?studentId=${child}&kind=photo&questionId=${question}`)).json();
  expect(attempts.rows.map((row: { correct: number }) => row.correct)).toEqual([1, 0, 0]);
  const board = await (await request.get(`/api/parent/children/${child}/rankings?board=math-8a-01`)).json();
  expect(board.rows.length).toBe(2);
  expect(board.rows.every((row: { rank: number }) => row.rank === 1)).toBe(true);
  expect(board.rows.every((row: object) => !('studentId' in row) && !('displayName' in row))).toBe(true);
  expect(board.rows.some((row: { isSelf: boolean; label: string }) => !row.isSelf && row.label.startsWith('同学 '))).toBe(true);
  const report = await (await request.get(`/api/parent/children/${child}/report`)).json();
  expect(report.subjects.find((row: { subject: string }) => row.subject === '数学').totalMinutes).toBeGreaterThanOrEqual(12);
  const growth = await (await request.get(`/api/parent/children/${child}/growth?days=7`)).json();
  expect(growth.points.some((point: { subjects: { subject: string; read: number | null; minutes: number }[] }) => point.subjects.some(row => row.subject === '数学' && row.read === null && row.minutes === 0))).toBe(true);
  expect(growth.points.find((point: { day: string }) => point.day === beijingDay()).subjects.some((row: { subject: string; read: number | null; minutes: number }) => row.subject === '数学' && row.read === 2 && row.minutes === 12)).toBe(true);
  const units = await (await request.get(`/api/parent/children/${child}/unit-report`)).json();
  expect(units.units.find((unit: { id: string }) => unit.id === 'math-8a-02').activeMinutes).toBeNull();
  expect(units.units.find((unit: { id: string }) => unit.id === 'math-8a-01').activeMinutes).toBe(2);
});

test('history API: device rewards and cloud ledger remain separate; another parent cannot read history', async ({ request }) => {
  const rewards = await (await request.get(`/api/parent/children/${child}/rewards`)).json();
  expect(rewards.summaries.some((row: { paidCash: number }) => row.paidCash === 1200)).toBe(true);
  expect(rewards.entries.length).toBe(2);
  expect(rewards.confirmations.length).toBe(1);
  expect(rewards.entries.filter((row: { confirmation: unknown }) => row.confirmation !== null).length).toBe(1);
  await loginPost(request, { headers: { 'X-Growing-Client': '1' }, data: { username: users.parentB.username, password } });
  for (const path of [
    `/api/parent/children/${child}/handwriting?key=${encodeURIComponent(manuscriptKey)}`,
    `/api/question-bank/unit-wrong-history?studentId=${child}`,
    `/api/question-bank/questions/${question}/review?studentId=${child}`,
    `/api/parent/children/${child}/rewards`
  ]) expect((await request.get(path)).status()).toBe(404);
  await loginPost(request, { headers: { 'X-Growing-Client': '1' }, data: { username: users.admin.username, password } });
  const ledger = await (await request.get(`/api/admin/redemptions?student=${child}&parent=${users.parentA.id}`)).json();
  expect(ledger.total).toBe(1);
  expect(ledger.rows[0].amount).toBe(500);
  expect('hash' in ledger.rows[0]).toBe(false);
});
