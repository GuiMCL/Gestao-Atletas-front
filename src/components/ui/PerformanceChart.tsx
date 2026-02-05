'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export type ChartType = 'line' | 'bar';

export interface PerformanceChartProps {
  data: Array<Record<string, any>>;
  xAxisKey: string;
  yAxisKeys: Array<{ key: string; color: string; name?: string }>;
  type?: ChartType;
  height?: number;
  className?: string;
  title?: string;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  xAxisKey,
  yAxisKeys,
  type = 'line',
  height = 300,
  className = '',
  title,
}) => {
  const ChartComponent = type === 'line' ? LineChart : BarChart;

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-3 sm:p-4 md:p-6 ${className}`}>
      {title && (
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{title}</h3>
      )}
      <div className="overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6">
        <div className="min-w-[300px]">
          <ResponsiveContainer width="100%" height={height}>
            <ChartComponent data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey={xAxisKey}
                stroke="#6b7280"
                style={{ fontSize: '10px' }}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '10px' }}
                tick={{ fontSize: 10 }}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '10px' }}
                iconSize={10}
              />
              {type === 'line' ? (
                yAxisKeys.map((yAxis) => (
                  <Line
                    key={yAxis.key}
                    type="monotone"
                    dataKey={yAxis.key}
                    stroke={yAxis.color}
                    strokeWidth={2}
                    name={yAxis.name || yAxis.key}
                    dot={{ fill: yAxis.color, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))
              ) : (
                yAxisKeys.map((yAxis) => (
                  <Bar
                    key={yAxis.key}
                    dataKey={yAxis.key}
                    fill={yAxis.color}
                    name={yAxis.name || yAxis.key}
                  />
                ))
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
