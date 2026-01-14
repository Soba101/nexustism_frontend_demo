'use client';

import { useReportWebVitals } from 'next/web-vitals';

interface Metric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  id: string;
}

/**
 * Web Vitals Reporter Component
 * Must be used in a Client Component
 */
export function WebVitalsReporter() {
  useReportWebVitals((metric: Metric) => {
    const { name, value, rating, id } = metric;
    
    // Color-coded console output
    const color = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
    
    console.log(
      `${color} [Web Vitals] ${name}:`,
      `${Math.round(value)}ms`,
      `(${rating})`,
      `[ID: ${id}]`
    );

    // Future: Send to analytics
    // if (window.gtag) {
    //   window.gtag('event', name, {
    //     value: Math.round(value),
    //     metric_id: id,
    //     metric_rating: rating,
    //   });
    // }
  });

  return null;
}
