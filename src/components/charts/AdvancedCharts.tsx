"use client";

import * as React from "react";
import { memo, useMemo } from "react";
import { Cell, ResponsiveContainer, Funnel, FunnelChart, Tooltip } from "recharts";

// SLA Gauge Chart Component
interface GaugeChartProps {
  value: number; // 0-100
  label?: string;
  thresholds?: { good: number; warning: number }; // e.g., { good: 90, warning: 70 }
}

export const GaugeChart = memo(({ value, label = "Compliance", thresholds = { good: 90, warning: 70 } }: GaugeChartProps) => {
  const getColor = (val: number) => {
    if (val >= thresholds.good) return '#10b981'; // green
    if (val >= thresholds.warning) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const color = getColor(value);
  return (
    <div className="relative w-full h-48 flex flex-col items-center justify-center">
      <svg viewBox="0 0 200 120" className="w-full h-full">
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="20"
          strokeLinecap="round"
        />
        {/* Colored arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="20"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 251.2} 251.2`}
          className="transition-all duration-1000 ease-out"
        />
        {/* Center text */}
        <text x="100" y="85" textAnchor="middle" className="text-4xl font-bold" fill="currentColor">
          {value}%
        </text>
        <text x="100" y="105" textAnchor="middle" className="text-sm" fill="hsl(var(--muted-foreground))">
          {label}
        </text>
      </svg>
      
      {/* Legend */}
      <div className="flex gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-slate-600 dark:text-slate-400">{thresholds.warning}-{thresholds.good}%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-slate-600 dark:text-slate-400">{thresholds.good}%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-slate-600 dark:text-slate-400">&lt;{thresholds.warning}%</span>
        </div>
      </div>
    </div>
  );
});

GaugeChart.displayName = 'GaugeChart';

// Heatmap Component
interface HeatmapCell {
  day: string;
  hour: number;
  value: number;
}

interface HeatmapProps {
  data: HeatmapCell[];
  onClick?: (cell: HeatmapCell) => void;
}

export const Heatmap = memo(({ data, onClick }: HeatmapProps) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const getColor = (value: number, max: number) => {
    const intensity = value / max;
    if (intensity > 0.8) return 'bg-blue-600 dark:bg-blue-500';
    if (intensity > 0.6) return 'bg-blue-500 dark:bg-blue-400';
    if (intensity > 0.4) return 'bg-blue-400 dark:bg-blue-300';
    if (intensity > 0.2) return 'bg-blue-300 dark:bg-blue-200';
    if (intensity > 0) return 'bg-blue-200 dark:bg-blue-100';
    return 'bg-slate-100 dark:bg-slate-800';
  };

  const maxValue = Math.max(...data.map(d => d.value), 1);

  // Group data by day and hour
  const heatmapData = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(cell => {
      const key = `${cell.day}-${cell.hour}`;
      map[key] = cell.value;
    });
    return map;
  }, [data]);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        <div className="grid grid-cols-[3rem_auto] gap-2">
          <div />
          <div className="grid grid-cols-[repeat(24,1.5rem)] gap-0.5 text-xs text-slate-600 dark:text-slate-400 mb-1">
            {hours.map((hour) => (
              <div key={hour} className="text-center">
                {[0, 6, 12, 18, 23].includes(hour) ? `${hour}h` : ''}
              </div>
            ))}
          </div>

          {days.map((day) => (
            <React.Fragment key={day}>
              <div className="h-6 flex items-center justify-end pr-2 text-xs text-slate-600 dark:text-slate-400">
                {day}
              </div>
              <div className="grid grid-cols-[repeat(24,1.5rem)] gap-0.5">
                {hours.map((hour) => {
                  const key = `${day}-${hour}`;
                  const value = heatmapData[key] || 0;
                  return (
                    <div
                      key={hour}
                      className={`w-6 h-6 rounded ${getColor(value, maxValue)} cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all`}
                      onClick={() => onClick?.({ day, hour, value })}
                      title={`${day} ${hour}:00 - ${value} tickets`}
                    />
                  );
                })}
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-4 text-xs text-slate-600 dark:text-slate-400">
          <span>Low</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800"></div>
            <div className="w-4 h-4 rounded bg-blue-200 dark:bg-blue-100"></div>
            <div className="w-4 h-4 rounded bg-blue-400 dark:bg-blue-300"></div>
            <div className="w-4 h-4 rounded bg-blue-500 dark:bg-blue-400"></div>
            <div className="w-4 h-4 rounded bg-blue-600 dark:bg-blue-500"></div>
          </div>
          <span>High</span>
        </div>
      </div>
    </div>
  );
});

Heatmap.displayName = 'Heatmap';

// Funnel Chart Component
interface FunnelData {
  name: string;
  value: number;
  fill: string;
}

interface FunnelChartProps {
  data: FunnelData[];
  onClick?: (data: FunnelData) => void;
}

export const FunnelChartComponent = memo(({ data, onClick }: FunnelChartProps) => {
  const total = data[0]?.value || 1;

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-lg">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{data.name}</p>
                    <p className="text-lg font-bold" style={{ color: data.fill }}>{data.value}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {((data.value / total) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Funnel
            dataKey="value"
            data={data}
            isAnimationActive
            onClick={(data) => onClick?.(data)}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} cursor={onClick ? 'pointer' : 'default'} />
            ))}
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  );
});

FunnelChartComponent.displayName = 'FunnelChartComponent';

// Stacked Bar Chart for Team Performance
interface StackedBarData {
  team: string;
  resolved: number;
  inProgress: number;
  new: number;
}

interface StackedBarChartProps {
  data: StackedBarData[];
  onClick?: (team: string) => void;
}

export const StackedBarChart = memo(({ data, onClick }: StackedBarChartProps) => {
  return (
    <div className="space-y-4">
      {data.map((item) => {
        const total = item.resolved + item.inProgress + item.new;
        const resolvedPct = (item.resolved / total) * 100;
        const inProgressPct = (item.inProgress / total) * 100;
        const newPct = (item.new / total) * 100;

        return (
          <div key={item.team} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.team}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">{total} tickets</span>
            </div>
            <div 
              className="flex h-8 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              onClick={() => onClick?.(item.team)}
            >
              <div 
                className="bg-green-500 dark:bg-green-400 flex items-center justify-center text-xs font-semibold text-white"
                style={{ width: `${resolvedPct}%` }}
                title={`Resolved: ${item.resolved}`}
              >
                {resolvedPct > 15 && `${item.resolved}`}
              </div>
              <div 
                className="bg-yellow-500 dark:bg-yellow-400 flex items-center justify-center text-xs font-semibold text-white"
                style={{ width: `${inProgressPct}%` }}
                title={`In Progress: ${item.inProgress}`}
              >
                {inProgressPct > 15 && `${item.inProgress}`}
              </div>
              <div 
                className="bg-blue-500 dark:bg-blue-400 flex items-center justify-center text-xs font-semibold text-white"
                style={{ width: `${newPct}%` }}
                title={`New: ${item.new}`}
              >
                {newPct > 15 && `${item.new}`}
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Legend */}
      <div className="flex gap-4 text-xs mt-4">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span className="text-slate-600 dark:text-slate-400">Resolved</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500"></div>
          <span className="text-slate-600 dark:text-slate-400">In Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span className="text-slate-600 dark:text-slate-400">New</span>
        </div>
      </div>
    </div>
  );
});

StackedBarChart.displayName = 'StackedBarChart';

