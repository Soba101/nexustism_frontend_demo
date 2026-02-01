import type { UserPreferences } from '@/types';

export const MOCK_USER_PREFERENCES: UserPreferences = {
  theme: 'light',
  language: 'en',
  timezone: 'America/New_York',
  dateFormat: 'MM/DD/YYYY',
  defaultPage: 'search',
  itemsPerPage: 10,
  notifications: {
    showToasts: true,
    emailAlerts: false,
    desktopNotifications: false,
  },
  accessibility: {
    fontSize: 14,
    reduceMotion: false,
    highContrast: false,
  },
  uiDensity: 'comfortable',
};
