/**
 * Business Timezone Helpers (Africa/Johannesburg default)
 */

export function getBusinessTimezone(): string {
  return process.env.CRON_TIMEZONE || 'Africa/Johannesburg';
}

export function businessDateStr(d: Date = new Date(), tz = getBusinessTimezone()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(d);
}

export function businessNow(tz = getBusinessTimezone()): {
  dateStr: string;
  timeStr: string;
  hour: number;
  minute: number;
} {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '00';
  const year = get('year');
  const month = get('month');
  const day = get('day');
  const rawHour = parseInt(get('hour'), 10) % 24;
  const minute = parseInt(get('minute'), 10);
  const hourStr = String(rawHour).padStart(2, '0');
  const minStr = String(minute).padStart(2, '0');
  return {
    dateStr: `${year}-${month}-${day}`,
    timeStr: `${hourStr}:${minStr}`,
    hour: rawHour,
    minute,
  };
}
