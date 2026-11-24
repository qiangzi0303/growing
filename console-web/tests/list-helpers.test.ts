import { expect, it } from 'vitest';
import { formatBeijingTime } from '@/utils/datetime';
import { useColumnChecks } from '@/hooks/common/table-columns';

it('shows stored UTC timestamps as Beijing YYYY-MM-DD HH:mm on one line', () => {
  expect(formatBeijingTime('2026-11-05T00:00:00.000Z')).toBe('2026-11-05 08:00');
  expect(formatBeijingTime('2026-11-24T16:30:00Z')).toBe('2026-11-25 00:30');
  expect(formatBeijingTime('2026-11-24 16:30:00')).toBe('2026-11-25 00:30');
  expect(formatBeijingTime('2026-11-24T08:05:09+08:00')).toBe('2026-11-24 08:05');
  expect(formatBeijingTime('2026-01-01')).toBe('2026-01-01');
  expect(formatBeijingTime(null)).toBe('—');
  expect(formatBeijingTime('', '暂无快照')).toBe('暂无快照');
  expect(formatBeijingTime('not a date')).toBe('not a date');
});

it('column checks hide, reorder and pin columns without touching the source', () => {
  const source = [{ title: '姓名', key: 'name', width: 100 }, { title: '时间', key: 'at', width: 150 }, { title: '操作', key: 'action', width: 80, fixed: 'right' as const }];
  const { checks, columns, scrollX } = useColumnChecks<{ name: string }>(() => source);
  expect(checks.value.map(check => [check.key, check.fixed])).toEqual([['name', 'unFixed'], ['at', 'unFixed'], ['action', 'right']]);
  expect(scrollX.value).toBe(330);
  checks.value[1].checked = false;
  checks.value[0].fixed = 'left';
  checks.value.reverse();
  expect(columns.value.map(column => [(column as { key: string }).key, column.fixed])).toEqual([['action', 'right'], ['name', 'left']]);
  expect(scrollX.value).toBe(180);
  expect(source[1]).toEqual({ title: '时间', key: 'at', width: 150 });
});
