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

/**
 * Converts a 24-hour time string (HH:mm) to 12-hour format with AM/PM.
 * Alias for formatTime12Hour kept for semantic clarity in hook contexts.
 */
export function convertTimeTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Converts a 12-hour time string (e.g., "2:30 PM") to 24-hour format (e.g., "14:30").
 */
export function convertTimeTo24Hour(time12Hour: string): string {
  const [time, period] = time12Hour.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  if (period?.toUpperCase() === 'PM' && hours !== 12) {
    return `${hours + 12}:${minutes.toString().padStart(2, '0')}`;
  } else if (period?.toUpperCase() === 'AM' && hours === 12) {
    return `00:${minutes.toString().padStart(2, '0')}`;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Converts a 12-hour time string to a DB-ready HH:mm:ss string.
 */
export function toDbTaskTime(time12Hour: string): string {
  const time24 = convertTimeTo24Hour(time12Hour);
  return time24.split(':').length === 2 ? `${time24}:00` : time24;
}
