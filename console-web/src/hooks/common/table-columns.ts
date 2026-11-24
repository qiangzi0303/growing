import { computed, ref } from 'vue';
import type { DataTableColumns } from 'naive-ui';

type Column<T> = DataTableColumns<T>[number];
type Sized = { width?: number | string; minWidth?: number | string };

function keyOf<T>(column: Column<T>) {
  return 'key' in column && column.key !== undefined && column.key !== null ? String(column.key) : '';
}

/**
 * Column visibility, order and pinning for TableColumnSetting.
 * Kept apart from data loading so each page keeps its own request, abort and permission logic.
 */
export function useColumnChecks<T>(source: () => DataTableColumns<T>) {
  const checks = ref<NaiveUI.TableColumnCheck[]>(
    source()
      .filter(column => keyOf(column))
      .map(column => ({
        key: keyOf(column),
        title: (column as { title?: unknown }).title as NaiveUI.TableColumnCheck['title'],
        checked: true,
        fixed: ((column as { fixed?: 'left' | 'right' }).fixed ?? 'unFixed') as NaiveUI.TableColumnFixed,
        visible: true
      }))
  );
  const columns = computed(() => {
    const byKey = new Map(source().map(column => [keyOf(column), column]));
    return checks.value
      .filter(check => check.checked && byKey.has(check.key))
      .map(check => ({ ...byKey.get(check.key)!, fixed: check.fixed === 'unFixed' ? undefined : check.fixed }) as Column<T>);
  });
  const scrollX = computed(() =>
    columns.value.reduce((sum, column) => sum + Number((column as Sized).width ?? (column as Sized).minWidth ?? 120), 0)
  );
  return { checks, columns, scrollX };
}
