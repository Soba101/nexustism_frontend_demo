"use client";

import * as React from "react";
import { Area, AreaChart as RechartsAreaChart, CartesianGrid, Line, LineChart as RechartsLineChart, Pie, PieChart as RechartsPieChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

// Area Chart Component
interface AreaChartProps {
  data: number[];
  color?: string;
}

export const AreaChart = ({ data, color = "#10b981" }: AreaChartProps) => {
  const chartData = data.map((value, index) => ({
    day: `Day ${index + 1}`,
    value: value,
  }));

  const chartConfig = {
    value: {
      label: "Hours",
      color: color,
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <RechartsAreaChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.replace('Day ', 'D')}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="value"
          type="monotone"
          fill={color}
          fillOpacity={0.2}
          stroke={color}
          strokeWidth={2}
        />
      </RechartsAreaChart>
    </ChartContainer>
  );
};

// Simple Line Chart Component
interface SimpleLineChartProps {
  data: number[];
  color?: string;
}

export const SimpleLineChart = ({ data, color = "#3b82f6" }: SimpleLineChartProps) => {
  const chartData = data.map((value, index) => ({
    day: `Day ${index + 1}`,
    value: value,
  }));

  const chartConfig = {
    value: {
      label: "Tickets",
      color: color,
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <RechartsLineChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.replace('Day ', 'D')}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="value"
          type="monotone"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </RechartsLineChart>
    </ChartContainer>
  );
};

// Donut Chart Component
interface DonutChartData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
}

export const DonutChart = ({ data }: DonutChartProps) => {
  const chartData = data.map((item) => ({
    name: item.label,
    value: item.value,
    fill: item.color,
  }));

  const chartConfig = data.reduce((acc, item) => {
    acc[item.label.toLowerCase()] = {
      label: item.label,
      color: item.color,
    };
    return acc;
  }, {} as ChartConfig);

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
        />
      </RechartsPieChart>
    </ChartContainer>
  );
};
