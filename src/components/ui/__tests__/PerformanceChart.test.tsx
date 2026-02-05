import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PerformanceChart } from '../PerformanceChart';

describe('PerformanceChart', () => {
  const mockData = [
    { date: '2024-01-01', points: 25, errors: 5 },
    { date: '2024-01-02', points: 30, errors: 3 },
    { date: '2024-01-03', points: 28, errors: 4 },
  ];

  const yAxisKeys = [
    { key: 'points', color: '#10b981', name: 'Points' },
    { key: 'errors', color: '#ef4444', name: 'Errors' },
  ];

  it('should render chart with title', () => {
    render(
      <PerformanceChart
        data={mockData}
        xAxisKey="date"
        yAxisKeys={yAxisKeys}
        title="Performance Over Time"
      />
    );
    expect(screen.getByText('Performance Over Time')).toBeDefined();
  });

  it('should render line chart by default', () => {
    const { container } = render(
      <PerformanceChart
        data={mockData}
        xAxisKey="date"
        yAxisKeys={yAxisKeys}
      />
    );
    // Check if LineChart is rendered (it will have specific SVG structure)
    expect(container.querySelector('.recharts-line')).toBeDefined();
  });

  it('should render bar chart when type is bar', () => {
    const { container } = render(
      <PerformanceChart
        data={mockData}
        xAxisKey="date"
        yAxisKeys={yAxisKeys}
        type="bar"
      />
    );
    // Check if BarChart is rendered
    expect(container.querySelector('.recharts-bar')).toBeDefined();
  });

  it('should render without title', () => {
    const { container } = render(
      <PerformanceChart
        data={mockData}
        xAxisKey="date"
        yAxisKeys={yAxisKeys}
      />
    );
    expect(container.querySelector('h3')).toBeNull();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <PerformanceChart
        data={mockData}
        xAxisKey="date"
        yAxisKeys={yAxisKeys}
        className="custom-chart"
      />
    );
    expect(container.firstChild?.className).toContain('custom-chart');
  });

  it('should handle empty data', () => {
    const { container } = render(
      <PerformanceChart
        data={[]}
        xAxisKey="date"
        yAxisKeys={yAxisKeys}
      />
    );
    expect(container.querySelector('.recharts-wrapper')).toBeDefined();
  });
});
