export function getTodayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day, 12, 0, 0);
  }
  return new Date(dateStr);
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

export function getWeekMonday(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diffToMonday);
  return formatLocalDate(d);
}

export function getWeekDaysList(mondayStr: string): string[] {
  const list: string[] = [];
  for (let i = 0; i < 7; i++) {
    list.push(addDays(mondayStr, i));
  }
  return list;
}

export function formatDutchFullDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDutchShortDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function getDutchDayName(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString('nl-NL', { weekday: 'long' });
}
