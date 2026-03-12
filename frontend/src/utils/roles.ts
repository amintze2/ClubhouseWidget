export type AppJobRole = 'clubhouse_manager' | 'general_manager' | 'player';

export function getAppJobRole(userRole: string | null | undefined): AppJobRole {
  const normalized = userRole?.toLowerCase().trim() ?? '';

  if (normalized.includes('general') && normalized.includes('manager')) {
    return 'general_manager';
  }

  if (
    normalized === 'clubhouse_manager' ||
    (normalized.includes('clubhouse') && normalized.includes('manager')) ||
    (normalized.includes('manager') && !normalized.includes('general'))
  ) {
    return 'clubhouse_manager';
  }

  return 'player';
}

export function isClubhouseManagerRole(userRole: string | null | undefined): boolean {
  return getAppJobRole(userRole) === 'clubhouse_manager';
}

