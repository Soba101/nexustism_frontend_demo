/**
 * Web Vitals Monitoring Utilities
 * Tracks Core Web Vitals metrics for performance monitoring
 */

export interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
}

/**
 * Report Web Vitals metrics to console (can be extended to send to analytics service)
 */
export function reportWebVitals(metric: WebVitalsMetric) {
  const { name, value, rating, id } = metric;
  
  // Color-coded console output based on rating
  const color = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
  
  console.log(
    `${color} [Web Vitals] ${name}:`,
    `${Math.round(value)}ms`,
    `(${rating})`,
    `[ID: ${id}]`
  );

  // Future: Send to analytics service
  // if (typeof window !== 'undefined' && window.gtag) {
  //   window.gtag('event', name, {
  //     value: Math.round(value),
  //     metric_id: id,
  //     metric_value: value,
  //     metric_delta: metric.delta,
  //   });
  // }
}

/**
 * Get performance thresholds for each metric
 */
export function getThresholds(metricName: string) {
  const thresholds: Record<string, { good: number; poor: number }> = {
    LCP: { good: 2500, poor: 4000 },  // Largest Contentful Paint
    FID: { good: 100, poor: 300 },     // First Input Delay
    CLS: { good: 0.1, poor: 0.25 },    // Cumulative Layout Shift
    TTFB: { good: 800, poor: 1800 },   // Time to First Byte
    INP: { good: 200, poor: 500 },     // Interaction to Next Paint
  };
  
  return thresholds[metricName] || { good: 0, poor: 0 };
}
