/**
 * Utility helper functions
 */

/**
 * Export data to CSV file
 * @param data Array of objects to export
 * @param filename Name of the file to download
 */
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => Object.values(obj).map(v => 
    typeof v === 'string' && v.includes(',') ? `"${v}"` : v // Handle commas in strings
  ).join(','));
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
