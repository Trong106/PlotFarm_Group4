export interface CareLog {
  LogId?: number;
  CultivationId: number;
  ActivityType?: string;
  Title?: string;
  Notes?: string;
  LogDate?: string;
  CreatedAt?: string;
}
const DAY = 86400000;
const OFFSET = 7 * 3600000;
const normalized = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toUpperCase();

/** Calendar week in Vietnam, Monday to Sunday; only recorded past activities. */
export function weeklyCare<T extends CareLog>(logs: T[], cultivationId: number, now = new Date()) {
  const today = new Date(now.getTime() + OFFSET);
  const dayStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - OFFSET;
  const start = dayStart - ((today.getUTCDay() + 6) % 7) * DAY;
  const end = start + 7 * DAY;
  const label = (time: number) => {
    const date = new Date(time + OFFSET);
    return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  };
  const seen = new Set<number>();
  const items = logs.flatMap((log) => {
    if (log.CultivationId !== cultivationId || (log.LogId != null && seen.has(log.LogId))) return [];
    if (log.LogId != null) seen.add(log.LogId);
    // SQL LogDate is DATE, even when the driver serializes it as midnight UTC.
    const day = log.LogDate?.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    const time = day ? Date.parse(`${day}T00:00:00+07:00`) : Date.parse(log.CreatedAt || '');
    if (!Number.isFinite(time) || time < start || time >= end || time > now.getTime()) return [];
    const type = normalized(log.ActivityType || '');
    const content = /^(CARE_ACTIVITY|CARE|CHAM SOC)$/.test(type) ? normalized(log.Title || '') : type;
    const kinds: ('WATERING' | 'FERTILIZING')[] = [];
    if (/WATERING|IRRIGATION|TUOI NUOC/.test(content)) kinds.push('WATERING');
    if (/FERTILI[ZS]|BON PHAN/.test(content)) kinds.push('FERTILIZING');
    return kinds.map(kind => ({ log, kind, time }));
  }).sort((a, b) => b.time - a.time || Date.parse(b.log.CreatedAt || '') - Date.parse(a.log.CreatedAt || '') || (b.log.LogId || 0) - (a.log.LogId || 0));
  return { startLabel: label(start), endLabel: label(end - 1),
    watering: items.filter(item => item.kind === 'WATERING').length,
    fertilizing: items.filter(item => item.kind === 'FERTILIZING').length, items };
}
