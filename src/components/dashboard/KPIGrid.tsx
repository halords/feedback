"use client";

import React, { useMemo } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { ChartCard } from "./ChartCard";
import { Bar, Line, Chart } from "react-chartjs-2";
import { useTheme } from "@/context/ThemeContext";
import { aggregateForCharts } from "@/lib/charts/aggregators";

export function KPIGrid() {
  const { data, isLoading, visibleMonths } = useDashboard();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const chartData = useMemo(() => aggregateForCharts(data, visibleMonths), [data, visibleMonths]);
  const labels = chartData.map(d => d.name);

  // 1. Overall Feedback Rating (Bar) - "rate"
  const rateData = {
    labels,
    datasets: [{
      label: 'Satisfaction Rate (%)',
      data: chartData.map(d => d.overrate),
      backgroundColor: isDark ? '#38bdf8' : '#24389c',
      borderRadius: 6,
      barThickness: 32,
    }]
  };

  // 2. Breakdown of Rating Data (Bar) - "breakdown"
  const breakdownData = {
    labels,
    datasets: [
      {
        label: 'Environment (Q1)',
        data: chartData.map(d => d.q1Rate),
        backgroundColor: '#24389c',
        borderRadius: 4,
        barThickness: 12,
      },
      {
        label: 'Systems & Procedures',
        data: chartData.map(d => d.sysRate),
        backgroundColor: '#3f51b5',
        borderRadius: 4,
        barThickness: 12,
      },
      {
        label: 'Staff Service',
        data: chartData.map(d => d.staffRate),
        backgroundColor: '#68fadd',
        borderRadius: 4,
        barThickness: 12,
      },
    ]
  };

  // 3. Overall Collection Rate (Line) - "collect"
  const collectRateData = {
    labels,
    datasets: [{
      label: 'Collection Rate (%)',
      data: chartData.map(d => d.collectRate),
      borderColor: '#dc2626',
      backgroundColor: '#dc2626',
      tension: 0.4,
      fill: true,
    }]
  };

  // 4. Breakdown of Collection vs Logbook (Bar/Line) - "collectBreak"
  const collectBreakData = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Form Collection',
        data: chartData.map(d => d.collection),
        backgroundColor: '#24389c',
        borderRadius: 4,
      },
      {
        type: 'line' as const,
        label: 'Total Visitors',
        data: chartData.map(d => d.visitor),
        borderColor: '#68fadd',
        borderWidth: 2,
        pointRadius: 4,
      }
    ]
  };

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: isDark ? 'rgba(240, 242, 245, 0.1)' : 'rgba(25, 28, 30, 0.1)' },
        ticks: { color: isDark ? '#f0f2f5' : '#191c1e' }
      },
      x: {
        grid: { display: false },
        ticks: { color: isDark ? '#f0f2f5' : '#191c1e' }
      }
    },
    plugins: {
      legend: {
        labels: { color: isDark ? '#f0f2f5' : '#191c1e' }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
      {/* Chart 1: Rate */}
      <ChartCard title="Overall Feedback Rating" subtitle="Satisfaction points aggregated for PTO/PHO groups" isLoading={isLoading}>
        <Bar data={rateData} options={chartOptions} />
      </ChartCard>

      {/* Chart 2: Breakdown */}
      <ChartCard title="Breakdown of Rating Data" subtitle="Pillar-based metrics (Environment, Systems, Staff)" isLoading={isLoading}>
        <Bar data={breakdownData} options={chartOptions} />
      </ChartCard>

      {/* Chart 3: Collection Rate */}
      <ChartCard title="Overall Collection Rate" subtitle="Percentage of visitors who provided feedback" isLoading={isLoading}>
        <Line data={collectRateData} options={chartOptions} />
      </ChartCard>

      {/* Chart 4: Collection Volume */}
      <ChartCard title="Collection vs Logbook" subtitle="Raw counts of forms collected vs total visitors" isLoading={isLoading}>
        <Chart type="bar" data={collectBreakData as any} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, max: undefined } } }} />
      </ChartCard>
    </div>
  );
}
