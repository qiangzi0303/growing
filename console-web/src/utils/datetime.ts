const beijing = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
});

/**
 * Display a stored timestamp as Beijing time `YYYY-MM-DD HH:mm`.
 * Stored timestamps are UTC: a value without an offset is read as UTC, never as browser-local time.
 * Date-only values stay as they are, unparsable values are shown unchanged rather than hidden.
 */
export function formatBeijingTime(value: string | null | undefined, fallback = '—') {
  if (!value) return fallback;
  const text = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const iso = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(text) ? `${text.replace(' ', 'T')}Z` : text;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return text;
  const parts = Object.fromEntries(beijing.formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}
