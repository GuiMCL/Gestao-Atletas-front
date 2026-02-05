import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatisticsCard } from '../StatisticsCard';

describe('StatisticsCard', () => {
  it('should render title and value', () => {
    render(<StatisticsCard title="Attack Efficiency" value="45.2%" />);
    expect(screen.getByText('Attack Efficiency')).toBeDefined();
    expect(screen.getByText('45.2%')).toBeDefined();
  });

  it('should render numeric value', () => {
    render(<StatisticsCard title="Total Points" value={125} />);
    expect(screen.getByText('Total Points')).toBeDefined();
    expect(screen.getByText('125')).toBeDefined();
  });

  it('should render subtitle when provided', () => {
    render(
      <StatisticsCard
        title="Serve Efficiency"
        value="38.5%"
        subtitle="Last 5 matches"
      />
    );
    expect(screen.getByText('Last 5 matches')).toBeDefined();
  });

  it('should render trend indicator when provided', () => {
    render(
      <StatisticsCard
        title="Attack Efficiency"
        value="45.2%"
        trend="up"
        trendValue="+5.2%"
      />
    );
    expect(screen.getByText('+5.2%')).toBeDefined();
    expect(screen.getByText('↑')).toBeDefined();
  });

  it('should render down trend', () => {
    render(
      <StatisticsCard
        title="Errors"
        value={12}
        trend="down"
        trendValue="-3"
      />
    );
    expect(screen.getByText('-3')).toBeDefined();
    expect(screen.getByText('↓')).toBeDefined();
  });

  it('should render neutral trend', () => {
    render(
      <StatisticsCard
        title="Reception"
        value="50%"
        trend="neutral"
        trendValue="0%"
      />
    );
    expect(screen.getByText('0%')).toBeDefined();
    expect(screen.getByText('→')).toBeDefined();
  });

  it('should render icon when provided', () => {
    const icon = <svg data-testid="test-icon" />;
    render(<StatisticsCard title="Points" value={100} icon={icon} />);
    expect(screen.getByTestId('test-icon')).toBeDefined();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <StatisticsCard
        title="Test"
        value={10}
        className="custom-class"
      />
    );
    expect(container.firstChild?.className).toContain('custom-class');
  });
});
