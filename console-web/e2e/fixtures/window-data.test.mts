import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { beijingDay, windowFixtureStatements } from './window-data.ts';
import { users } from './local-users.ts';

test('fixture uses Beijing midnight and moves the same SQLite rows across future runs', () => {
  assert.equal(beijingDay(new Date('2026-11-11T15:59:59Z')), '2026-11-11');
  assert.equal(beijingDay(new Date('2026-11-11T16:00:00Z')), '2026-11-12');
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(`CREATE TABLE GrowingStudyTime(StudentId TEXT,Day TEXT,Subject TEXT,Seconds INTEGER,UpdatedAt TEXT,PRIMARY KEY(StudentId,Day,Subject));
      CREATE TABLE GrowingDailySnapshots(StudentId TEXT,Day TEXT,Subject TEXT,Read INTEGER,Mastered INTEGER,Practice INTEGER,UpdatedAt TEXT,PRIMARY KEY(StudentId,Day,Subject));
      `);
    // A distinct row with the same subject must never be moved by fixture preparation.
    db.prepare('INSERT INTO GrowingStudyTime VALUES (?,?,?,?,?)').run(users.childB.id, '2026-11-05', '数学', 720, '2026-11-05T00:00:00.000Z');
    db.prepare('INSERT INTO GrowingStudyTime VALUES (?,?,?,?,?)').run(users.childA.id, '2026-01-01', '数学', 600, 'unrelated-row');
    for (const instant of ['2026-11-05T00:00:00Z', '2026-11-11T16:00:00Z', '2026-11-20T00:00:00Z', '2026-11-20T00:00:00Z']) {
      db.exec(windowFixtureStatements(new Date(instant)).join('\n'));
      const day = new Date(new Date(instant).getTime() + 8 * 3600000).toISOString().slice(0, 10);
      for (const table of ['GrowingStudyTime', 'GrowingDailySnapshots']) {
        const rows = db.prepare(`SELECT * FROM ${table} WHERE StudentId=? AND UpdatedAt=?`).all(users.childA.id, '2026-11-05T00:00:00.000Z');
        assert.equal(rows.length, 1, 'fixture days must not accumulate');
        assert.equal(rows[0].Day, day);
      }
      // One snapshot among seven days leaves six real missing-snapshot points.
      assert.equal(Number(db.prepare('SELECT COUNT(*) AS n FROM GrowingDailySnapshots WHERE StudentId=? AND Day>=date(?,\'-6 days\') AND Day<=?').get(users.childA.id, day, day)?.n), 1);
    }
    assert.equal(db.prepare('SELECT Day FROM GrowingStudyTime WHERE StudentId=?').get(users.childB.id)?.Day, '2026-11-05');
    assert.equal(db.prepare('SELECT Day FROM GrowingStudyTime WHERE UpdatedAt=?').get('unrelated-row')?.Day, '2026-01-01');
    db.prepare('INSERT INTO GrowingStudyTime VALUES (?,?,?,?,?)').run(users.childA.id, '2026-11-21', '数学', 600, 'collision-row');
    assert.throws(() => db.exec(windowFixtureStatements(new Date('2026-11-21T00:00:00Z')).join('\n')), /UNIQUE constraint/);
    assert.equal(db.prepare('SELECT Seconds FROM GrowingStudyTime WHERE UpdatedAt=?').get('collision-row')?.Seconds, 600);
  } finally { db.close(); }
});
