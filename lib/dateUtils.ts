// Date utility functions

export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
}

export function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function getToday(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return {
    start,
    end: now,
  };
}

export function isWithinDateRange(date: Date, start: Date, end: Date): boolean {
  const checkDate = new Date(date);
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  // Set to start of day for fair comparison
  checkDate.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  
  return checkDate >= startDate && checkDate <= endDate;
}

export function getThisWeek(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: getStartOfWeek(now),
    end: now,
  };
}

export function formatDateRange(start: Date, end: Date): string {
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  if (start.toDateString() === end.toDateString()) {
    return endStr;
  }
  
  return `${startStr} - ${endStr}`;
}
