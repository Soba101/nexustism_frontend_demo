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
    const color = rating === 'good' ? '\u2705' : rating === 'needs-improvement' ? '\u26a0\ufe0f' : '\u274c';

    console.log(
      `${color} [Web Vitals] ${name}:`,
      `${Math.round(value)}ms`,
      `(${rating})`,
      `[ID: ${id}]`
    );

    // Phase 6.3: POST metrics to backend for observability
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8001';
    fetch(`${apiBase}/api/metrics/web-vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, value, rating, id }),
    }).catch(() => {
      // Fire-and-forget — never block or surface errors to the user
    });
  });

  return null;
}
