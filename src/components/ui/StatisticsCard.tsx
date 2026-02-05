'use client';

import React from 'react';

export type TrendDirection = 'up' | 'down' | 'neutral';

export interface StatisticsCardProps {
  title: string;
  value: number | string;
  trend?: TrendDirection;
  trendValue?: string;
  icon?: React.ReactNode;
  className?: string;
  subtitle?: string;
}

export const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  trend,
  trendValue,
  icon,
  className = '',
  subtitle,
}) => {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className={`flex items-center mt-2 text-xs sm:text-sm ${trendColors[trend]}`}>
              <span className="mr-1">{trendIcons[trend]}</span>
              <span className="truncate">{trendValue}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-2 sm:ml-4 text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
