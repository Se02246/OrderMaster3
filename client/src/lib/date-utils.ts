import { format, isValid, parse } from "date-fns";
import { it } from "date-fns/locale";

/**
 * Formats a date string (YYYY-MM-DD) into Italian format (DD/MM/YYYY)
 */
export function formatDateForDisplay(dateStr: string): string {
  const parsedDate = parse(dateStr, "yyyy-MM-dd", new Date());
  
  if (!isValid(parsedDate)) {
    return dateStr;
  }
  
  return format(parsedDate, "dd/MM/yyyy", { locale: it });
}

/**
 * Formats a date object into Italian format with month name (15 Luglio 2023)
 */
export function formatDateWithMonthName(date: Date): string {
  if (!isValid(date)) {
    return "";
  }
  
  return format(date, "d MMMM yyyy", { locale: it });
}

/**
 * Formats a date object into Italian month and year format (Luglio 2023)
 */
export function formatMonthYear(date: Date): string {
  if (!isValid(date)) {
    return "";
  }
  
  return format(date, "MMMM yyyy", { locale: it });
}

/**
 * Converts a date string (YYYY-MM-DD) to a Date object
 */
export function parseISODate(dateStr: string): Date {
  return parse(dateStr, "yyyy-MM-dd", new Date());
}

/**
 * Gets an array of days in a month with their state (prev month, current month, next month)
 */
export function getDaysOfMonth(year: number, month: number): Array<{
  date: Date;
  isCurrentMonth: boolean;
}> {
  const result = [];
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  
  // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
  // Adjust for Monday as the first day of the week
  let firstDayOfWeek = firstDay.getDay();
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  
  // Add days from previous month
  const daysFromPrevMonth = firstDayOfWeek;
  for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
    const day = new Date(year, month - 2, lastDay.getDate() - i);
    result.push({
      date: day,
      isCurrentMonth: false,
    });
  }
  
  // Add days from current month
  const daysInMonth = lastDay.getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    const day = new Date(year, month - 1, i);
    result.push({
      date: day,
      isCurrentMonth: true,
    });
  }
  
  // Add days from next month to complete the grid (6 weeks = 42 days)
  const totalDaysNeeded = 42;
  const remainingDays = totalDaysNeeded - result.length;
  for (let i = 1; i <= remainingDays; i++) {
    const day = new Date(year, month, i);
    result.push({
      date: day,
      isCurrentMonth: false,
    });
  }
  
  return result;
}
