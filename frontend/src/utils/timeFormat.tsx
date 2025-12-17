/**
 * Converts a 24-hour time string (HH:mm) to 12-hour format with AM/PM
 * @param time24 - Time string in 24-hour format (e.g., "14:30")
 * @returns Time string in 12-hour format (e.g., "2:30 PM")
 */
export function formatTime12Hour(time24: string): string {
  const [hourStr, minuteStr] = time24.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr;
  
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  return `${displayHour}:${minute} ${period}`;
}
