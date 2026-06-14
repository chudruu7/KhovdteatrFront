const MONGOLIA_OFFSET_MS = 7 * 60 * 60 * 1000;

export function isFutureShowTime(showTime?: string | null) {
  if (!showTime) return false;
  const time = new Date(showTime).getTime();
  return Number.isFinite(time) && time > Date.now();
}

export function buildShowTimeFromDateAndTime(date?: string | null, time?: string | null) {
  if (!date || !time || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }

  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const utcTime = Date.UTC(year, month - 1, day, hour, minute) - MONGOLIA_OFFSET_MS;
  return new Date(utcTime).toISOString();
}

export function isBookableShowTime(showTime?: string | null, date?: string | null, time?: string | null) {
  const resolvedShowTime = showTime || buildShowTimeFromDateAndTime(date, time);
  return isFutureShowTime(resolvedShowTime);
}
