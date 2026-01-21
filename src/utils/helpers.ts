/**
 * Utility helper functions
 */

/**
 * Export data to CSV file
 * @param data Array of objects to export
 * @param filename Name of the file to download
 */
export const exportToCSV = <T extends object>(data: T[], filename: string) => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0] as Record<string, unknown>).join(',');
  const rows = data.map(obj => Object.values(obj as Record<string, unknown>).map((value) => {
    if (value === null || value === undefined) return '';
    const text = typeof value === 'string'
      ? value
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);
    return text.includes(',') ? `"${text}"` : text;
  }).join(','));
  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Format date to locale string
 * @param date Date string or Date object
 * @param options Intl.DateTimeFormatOptions
 */
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions) => {
  return new Date(date).toLocaleDateString(undefined, options);
};

/**
 * Format time to locale string
 * @param date Date string or Date object
 * @param options Intl.DateTimeFormatOptions
 */
export const formatTime = (date: string | Date, options?: Intl.DateTimeFormatOptions) => {
  return new Date(date).toLocaleTimeString(undefined, options);
};

/**
 * Truncate text to specified length with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Get priority badge variant for styling
 * @param priority Ticket priority
 */
export const getPriorityVariant = (priority: string): 'critical' | 'high' | 'medium' | 'low' | 'default' => {
  const normalized = priority.toLowerCase();
  if (normalized === 'critical' || normalized === 'high' || normalized === 'medium' || normalized === 'low') {
    return normalized as 'critical' | 'high' | 'medium' | 'low';
  }
  return 'default';
};

/**
 * Calculate resolution time between opened and resolved dates
 * @param openedAt ISO date string
 * @param resolvedAt ISO date string (optional)
 */
export const calculateResolutionTime = (openedAt: string, resolvedAt?: string): string => {
  if (!resolvedAt) return 'Pending';
  
  const opened = new Date(openedAt);
  const resolved = new Date(resolvedAt);
  const diffMs = resolved.getTime() - opened.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h`;
  }
  return `${diffHours}h`;
};

/**
 * Highlight search terms in text with HTML mark tags
 * @param text Text to highlight
 * @param searchTerm Search term to highlight
 */
export const highlightSearchTerms = (text: string, searchTerm: string): string => {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900/50">$1</mark>');
};

/**
 * Debounce function for search input
 * @param func Function to debounce
 * @param delay Delay in milliseconds
 */
type AnyFunction = (...args: unknown[]) => void;

export const debounce = <T extends AnyFunction>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * LocalStorage helpers for user preferences
 */
export const storageHelper = {
  get: <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return defaultValue;
    }
  },
  
  set: <T,>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  },
  
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  },
  
  clear: (): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};
