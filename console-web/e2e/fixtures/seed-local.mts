import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import JSON5 from 'json5';
import { passwordHash } from '../../../cloudflare/src/auth.ts';
import { password, users } from './local-users.ts';
import { historyFixture as history, manuscript } from './history-data.mts';
import { windowFixtureStatements } from './window-data.ts';
import { hash as digest } from '../../../cloudflare/src/auth.ts';
import { assertLocalTarget, cloudflareDirectory, dbDirectory, localConfig, localOrigin, seedFile, temporaryDirectory, wranglerArguments } from './local-target.mts';

export async function prepareLocal() {
  assertLocalTarget(dbDirectory, localOrigin);
  mkdirSync(temporaryDirectory, { recursive: true });
  // Derive runtime settings from the real configuration, without production routing,
  // remote resource IDs or its build hook (which synchronizes unrelated sources).
  const source = JSON5.parse(readFileSync(resolve(cloudflareDirectory, 'wrangler.jsonc'), 'utf8'));
  const config = {
    name: 'growing-console-local-acceptance', main: resolve(cloudflareDirectory, source.main),
    compatibility_date: source.compatibility_date, compatibility_flags: source.compatibility_flags,
    assets: { ...source.assets, directory: resolve(cloudflareDirectory, source.assets.directory) },
    d1_databases: [{ binding: 'DB', database_name: 'growing-db', database_id: '13000000-0000-4000-8000-000000000000', migrations_dir: resolve(cloudflareDirectory, 'migrations') }],
    kv_namespaces: [{ binding: 'APK_FILES', id: 'local-acceptance-kv' }],
    ratelimits: source.ratelimits
  };
  writeFileSync(localConfig, JSON.stringify(config, null, 2));
  const hash = await passwordHash(password);
  const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;
  const statements = Object.values(users).map(user => `INSERT OR IGNORE INTO GrowingUsers (Id,Username,NormalizedName,DisplayName,SearchName,Role,PasswordHash,CreatedAt,RoleConfirmed) VALUES (${[user.id,user.username,user.username.toUpperCase(),user.displayName,user.displayName.toLowerCase(),user.role,hash,'2026-11-05T00:00:00.000Z'].map(quote).join(',')},${user.confirmed});`);
  statements.push(`INSERT OR IGNORE INTO GrowingAdministrators (UserId) VALUES (${quote(users.admin.id)});`);
  for (const child of [users.childA, users.childB]) statements.push(`INSERT OR IGNORE INTO GrowingFamilyLinks (ParentId,StudentId,CreatedAt) VALUES (${quote(users.parentA.id)},${quote(child.id)},'2026-11-05T00:00:00.000Z');`);
  const insert = (table: string, row: Record<string, string | number>) => {
    statements.push(`INSERT OR IGNORE INTO "${table}" (${Object.keys(row).map(key => `"${key}"`).join(',')}) VALUES (${Object.values(row).map(value => typeof value === 'number' ? String(value) : quote(value)).join(',')});`);
  };
  const child = users.childA.id;
  insert('GrowingQuestionPapers', { Id: '13000000-0000-4000-8000-000000000301', StudentId: users.childB.id, RequestId: 'local-legacy-paper', Fingerprint: 'local-legacy-paper', Title: '孩子乙兼容深链卷', Warnings: '[]', CreatedAt: history.at, Mode: 'paper' });
  // These two accounts are explicitly disposable action fixtures. Reset only their
  // exact synthetic IDs, with a username guard, so password/role tests can rerun.
  for (const user of [users.actionParent, users.actionChild]) statements.push(`UPDATE GrowingUsers SET Role=${quote(user.role)},RoleConfirmed=1,PasswordHash=${quote(hash)} WHERE Id=${quote(user.id)} AND Username=${quote(user.username)};`);
  for (const user of [users.pendingParent, users.pendingStudent]) statements.push(`UPDATE GrowingUsers SET Role='Student',RoleConfirmed=0 WHERE Id=${quote(user.id)} AND Username=${quote(user.username)};`);
  for (let index = 0; index < 22; index++) {
    const suffix = String(index).padStart(2, '0');
    insert('GrowingUsers', { Id: `13000000-0000-4000-8000-0000000002${suffix}`, Username: `e2e_page_${suffix}`, NormalizedName: `E2E_PAGE_${suffix}`, DisplayName: `分页验收${suffix}`, SearchName: `分页验收${suffix}`, Role: 'Student', PasswordHash: hash, CreatedAt: history.at, RoleConfirmed: 1 });
  }
  const document = (key: string, value: object) => insert('GrowingDocuments', { StudentId: child, Key: key, Value: JSON.stringify(value), Revision: 1, UpdatedAt: history.at });
  document(history.manuscriptKey, manuscript());
  document('growing-math-lessons-v1', { topics: { 'tri-lines': { seen: true }, 'square-root': { seen: true } }, tools: { days: { '2026-11-05': { 'tri-lines': { ms: 120000 } } } } });
  statements.push(...windowFixtureStatements());
  insert('GrowingQuestionPapers', { Id: history.paperId, StudentId: child, RequestId: 'local-history-paper', Fingerprint: 'local-history-paper', Title: '合成单元错题历史', Warnings: '[]', CreatedAt: history.at, Mode: 'unit-wrong-1025141010' });
  insert('GrowingPhotoQuestions', { Id: history.questionId, PaperId: history.paperId, Number: '1', Text: '合成验收：求三角形内角和', Answer: '180度', UnitId: 'math-8a-01', Reason: '历史夹具', Uncertain: '[]', Pages: '[]', Revision: 1, Reviewed: 1 });
  for (const index of [0, 1]) {
    const at = `2026-11-0${index + 4}T01:00:00.000Z`;
    const result = { verdict: index ? 'correct' : 'partial', score: index ? 100 : 50, studentAnswer: index ? '180度' : '90度', feedback: index ? '第二次：订正正确' : '第一次：角度计算遗漏', corrections: [], knowledge: [], models: [], answerSource: 'handwriting-only', answerPages: [history.answerImages[index]] };
    insert('GrowingPhotoGrades', { Id: `13000000-0000-4000-8000-00000000011${index}`, QuestionId: history.questionId, RequestId: `local-photo-${index}`, Fingerprint: `local-photo-${index}`, QuestionRevision: 1, Kind: index ? 'correction' : 'initial', StudentAnswer: result.studentAnswer, Result: JSON.stringify(result), CreatedAt: at });
  }
  for (const [index, correct] of [0,0,1].entries()) insert('GrowingQuestionAttempts', { StudentId: child, AttemptId: `local-history-attempt-${index}`, Kind: 'photo', QuestionId: history.questionId, Correct: correct, ActorId: child, CreatedAt: `2026-11-05T0${index + 1}:00:00.000Z` });
  for (const student of [users.childA.id, users.childB.id]) insert('GrowingRankings', { StudentId: student, BoardId: 'math-8a-01', Kind: 'unit', Subject: 'math', Term: 'upper', Title: '三角形', ConceptDone: 1, ConceptTotal: 12, TestDone: 2, TestTotal: 12, DiagnosisDone: 0, DiagnosisTotal: 12, Score: 917, UpdatedAt: history.at });
  const cash = { kind: 'cash', amount: 500, parent: '合成家长', at: Date.parse('2026-11-04T00:00:00Z') };
  document(history.rewardKey, { version: 1, paidCash: 1200, paidGame: 30, history: [cash, { kind: 'game', amount: 30, parent: '合成家长', at: Date.parse(history.at) }] });
  const entryHash = await digest(JSON.stringify({ documentKey: history.rewardKey, kind: cash.kind, amount: cash.amount, claimedParent: cash.parent, claimedAt: new Date(cash.at).toISOString() }));
  insert('GrowingRewardConfirmations', { Id: '13000000-0000-4000-8000-000000000120', StudentId: child, ParentId: users.parentA.id, DocumentKey: history.rewardKey, EntryHash: entryHash, Kind: 'cash', Amount: 500, ClaimedParent: cash.parent, ClaimedAt: new Date(cash.at).toISOString(), ConfirmedAt: history.at });
  const actionCash = { kind: 'cash', amount: 900, parent: '操作验收家长', at: Date.parse(history.at) };
  insert('GrowingDocuments', { StudentId: users.actionChild.id, Key: history.rewardKey, Value: JSON.stringify({ version: 1, paidCash: 900, paidGame: 0, history: [actionCash] }), Revision: 1, UpdatedAt: history.at });
  const actionHash = await digest(JSON.stringify({ documentKey: history.rewardKey, kind: actionCash.kind, amount: actionCash.amount, claimedParent: actionCash.parent, claimedAt: history.at }));
  // Remove only this exact disposable fixture entry so its confirmation dialog can
  // be exercised again. Never reset other children's ledger or existing preview DBs.
  statements.push(`DELETE FROM GrowingRewardConfirmations WHERE StudentId=${quote(users.actionChild.id)} AND ParentId=${quote(users.actionParent.id)} AND DocumentKey=${quote(history.rewardKey)} AND EntryHash=${quote(actionHash)};`);
  writeFileSync(seedFile, statements.join('\n'), 'utf8');
  for (const operation of ['migrate', 'seed'] as const) {
    const result = spawnSync(process.execPath, [resolve(cloudflareDirectory, 'node_modules/wrangler/bin/wrangler.js'), ...wranglerArguments(operation)], {
      cwd: cloudflareDirectory, stdio: 'inherit', env: { ...process.env, CI: '1', WRANGLER_SEND_METRICS: 'false' }
    });
    if (result.error || result.status !== 0) throw Error(`Local ${operation} failed: ${result.error?.message ?? result.status}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await prepareLocal();
