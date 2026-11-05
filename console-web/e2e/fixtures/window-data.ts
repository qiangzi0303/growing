import { users } from './local-users';

export function beijingDay(now = new Date()) {
  return new Date(now.getTime() + 8 * 3600000).toISOString().slice(0, 10);
}

export function windowFixtureStatements(now = new Date()) {
  const day = beijingDay(now);
  const student = users.childA.id;
  const marker = '2026-11-05T00:00:00.000Z';
  return [
    // Move only the original named fixture, preserving its stable marker. A
    // conflicting target key fails loudly instead of discarding another row.
    `UPDATE GrowingStudyTime SET Day='${day}' WHERE StudentId='${student}' AND Subject='数学' AND Seconds=720 AND UpdatedAt='${marker}';`,
    `UPDATE GrowingDailySnapshots SET Day='${day}' WHERE StudentId='${student}' AND Subject='数学' AND Read=2 AND Mastered=0 AND Practice=0 AND UpdatedAt='${marker}';`,
    `INSERT OR IGNORE INTO GrowingStudyTime (StudentId,Day,Subject,Seconds,UpdatedAt) VALUES ('${student}','${day}','数学',720,'${marker}');`,
    `INSERT OR IGNORE INTO GrowingDailySnapshots (StudentId,Day,Subject,Read,Mastered,Practice,UpdatedAt) VALUES ('${student}','${day}','数学',2,0,0,'${marker}');`
  ];
}
