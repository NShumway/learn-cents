export function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

export function randomDateBetween(startDaysAgo: number, endDaysAgo: number = 0): string {
  const days = Math.floor(Math.random() * (startDaysAgo - endDaysAgo)) + endDaysAgo;
  return formatDate(daysAgo(days));
}
