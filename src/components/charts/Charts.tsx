"use client";

import * as React from "react";
import { memo, useMemo } from "react";
import { Area, AreaChart as RechartsAreaChart, CartesianGrid, Line, LineChart as RechartsLineChart, Pie, PieChart as RechartsPieChart, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

// Area Chart Component
interface AreaChartProps {
  data: number[];
  color?: string;
  labels?: string[];
  onClick?: (data: any, index: number) => void;
}

export const AreaChart = memo(({ data, color = "#10b981", labels, onClick }: AreaChartProps) => {
  const chartData = useMemo(() => data.map((value, index) => ({
    day: labels ? labels[index] : `Day ${index + 1}`,
    displayDay: labels ? labels[index] : `D${index + 1}`,
    value: value,
    index: index
  })), [data, labels]);

  const chartConfig = useMemo(() => ({
    value: {
      label: "Hours",
      color: color,
    },
  } satisfies ChartConfig), [color]);

  const handleClick = (data: any) => {
    if (onClick && data && data.activePayload) {
      onClick(data.activePayload[0].payload, data.activePayload[0].payload.index);
    }
  };

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <RechartsAreaChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        onClick={handleClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
        <XAxis
          dataKey="displayDay"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }} />
        <Area
          dataKey="value"
          type="monotone"
          fill={color}
          fillOpacity={0.2}
          stroke={color}
          strokeWidth={2}
          activeDot={{ r: 6, strokeWidth: 2 }}
        />
      </RechartsAreaChart>
    </ChartContainer>
  );
});

AreaChart.displayName = 'AreaChart';

// Simple Line Chart Component
interface SimpleLineChartProps {
  data: number[];
  color?: string;
  labels?: string[];
  onClick?: (data: any, index: number) => void;
}

export const SimpleLineChart = memo(({ data, color = "#3b82f6", labels, onClick }: SimpleLineChartProps) => {
  const chartData = useMemo(() => data.map((value, index) => ({
    day: labels ? labels[index] : `Day ${index + 1}`,
    displayDay: labels ? labels[index] : `D${index + 1}`,
    value: value,
    index: index
  })), [data, labels]);

  const chartConfig = useMemo(() => ({
    value: {
      label: "Tickets",
      color: color,
    },
  } satisfies ChartConfig), [color]);

  const handleClick = (data: any) => {
    if (onClick && data && data.activePayload) {
      onClick(data.activePayload[0].payload, data.activePayload[0].payload.index);
    }
  };

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <RechartsLineChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        onClick={handleClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
        <XAxis
          dataKey="displayDay"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }} />
        <Line
          dataKey="value"
          type="monotone"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 2 }}
          activeDot={{ r: 6, strokeWidth: 2 }}
        />
      </RechartsLineChart>
    </ChartContainer>
  );
});

SimpleLineChart.displayName = 'SimpleLineChart';

// Donut Chart Component
interface DonutChartData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  onClick?: (data: DonutChartData, index: number) => void;
}

export const DonutChart = memo(({ data, onClick }: DonutChartProps) => {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const chartData = useMemo(() => data.map((item) => ({
    name: item.label,
    value: item.value,
    fill: item.color,
    originalData: item
  })), [data]);

  const chartConfig = useMemo(() => data.reduce((acc, item) => {
    acc[item.label.toLowerCase()] = {
      label: item.label,
      color: item.color,
    };
    return acc;
  }, {} as ChartConfig), [data]);

  const handleClick = (_: any, index: number) => {
    setActiveIndex(index);
    if (onClick) {
      onClick(data[index], index);
    }
  };

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square w-full max-w-[250px]">
      <RechartsPieChart width={250} height={250}>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={90}
          strokeWidth={2}
          paddingAngle={2}
          onClick={handleClick}
          style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`}
              opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
            />
          ))}
        </Pie>
      </RechartsPieChart>
    </ChartContainer>
  );
});

DonutChart.displayName = 'DonutChart';
