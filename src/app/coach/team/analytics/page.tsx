'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  getTeam, 
  getTeamStatistics, 
  getTeamRankings, 
  getTeamTrends 
} from '@/lib/api/team.api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { PerformanceChart } from '@/components/ui/PerformanceChart';
import { StatisticsCard } from '@/components/ui/StatisticsCard';
import type { 
  TeamDTO, 
  TeamStatisticsDTO, 
  AthleteRankingDTO, 
  TrendDataDTO,
  TeamAnalyticsFilters 
} from '@/types/athlete';

export default function TeamAnalyticsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const [team, setTeam] = useState<TeamDTO | null>(null);
  const [statistics, setStatistics] = useState<TeamStatisticsDTO | null>(null);
  const [rankings, setRankings] = useState<AthleteRankingDTO[]>([]);
  const [trends, setTrends] = useState<TrendDataDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<TeamAnalyticsFilters>({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [opponent, setOpponent] = useState('');
  const [fundamental, setFundamental] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'COACH' && user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    if (user) {
      // Get teamId from URL params
      const params = new URLSearchParams(window.location.search);
      const teamIdParam = params.get('teamId');
      loadAnalyticsData(teamIdParam || undefined);
    }
  }, [user, isAuthenticated, authLoading, router]);

  const loadAnalyticsData = async (teamIdParam?: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let teamId = teamIdParam;

      // If no teamId provided, get the first team
      if (!teamId) {
        const { getAllTeams } = await import('@/lib/api/team.api');
        const teams = await getAllTeams();
        
        if (teams.length === 0) {
          setError('Nenhum time encontrado. Entre em contato com um administrador.');
          setLoading(false);
          return;
        }

        teamId = teams[0].id;
      }

      // Fetch team details
      const teamData = await getTeam(teamId);
      setTeam(teamData);

      // Fetch team statistics
      const statsData = await getTeamStatistics(teamId);
      setStatistics(statsData);

      // Fetch rankings and trends with filters
      await applyFilters(teamId);
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Falha ao carregar dados de análise. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async (teamId?: string) => {
    const tid = teamId || 'team-1';
    
    const filterParams: TeamAnalyticsFilters = {};
    if (startDate) filterParams.startDate = startDate;
    if (endDate) filterParams.endDate = endDate;
    if (opponent) filterParams.opponent = opponent;
    if (fundamental && fundamental !== 'all') {
      filterParams.fundamental = fundamental as any;
    }

    try {
      const [rankingsData, trendsData] = await Promise.all([
        getTeamRankings(tid, filterParams),
        getTeamTrends(tid, filterParams)
      ]);
      
      setRankings(rankingsData);
      setTrends(trendsData);
      setFilters(filterParams);
    } catch (err) {
      console.error('Error applying filters:', err);
    }
  };

  const handleApplyFilters = () => {
    applyFilters();
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setOpponent('');
    setFundamental('');
    setFilters({});
    applyFilters();
  };

  // Prepare chart data from trends
  const prepareChartData = () => {
    if (!trends || trends.length === 0) return [];
    
    // Group trends by date
    const groupedByDate = trends.reduce((acc, trend) => {
      const date = new Date(trend.date).toLocaleDateString('pt-BR', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      if (!acc[date]) {
        acc[date] = { date };
      }
      
      acc[date][trend.metric] = trend.value;
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(groupedByDate);
  };

  // Get unique metrics from trends
  const getMetrics = () => {
    if (!trends || trends.length === 0) return [];
    
    const uniqueMetrics = Array.from(new Set(trends.map(t => t.metric)));
    
    const colorMap: Record<string, string> = {
      'attackEfficiency': '#3b82f6',
      'serveEfficiency': '#10b981',
      'receptionQuality': '#f59e0b',
      'blockEfficiency': '#8b5cf6',
      'totalPoints': '#ef4444',
    };
    
    return uniqueMetrics.map(metric => ({
      key: metric,
      color: colorMap[metric] || '#6b7280',
      name: formatMetricName(metric)
    }));
  };

  const formatMetricName = (metric: string): string => {
    return metric
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Table columns for rankings
  const rankingColumns = [
    {
      key: 'rank',
      header: 'Rank',
      sortable: true,
      render: (value: number, row: AthleteRankingDTO) => (
        <div className="flex items-center">
          <span className={`
            inline-flex items-center justify-center w-8 h-8 rounded-full font-semibold
            ${row.rank === 1 ? 'bg-yellow-100 text-yellow-800' : ''}
            ${row.rank === 2 ? 'bg-gray-100 text-gray-800' : ''}
            ${row.rank === 3 ? 'bg-orange-100 text-orange-800' : ''}
            ${row.rank > 3 ? 'bg-blue-50 text-blue-700' : ''}
          `}>
            {row.rank}
          </span>
        </div>
      ),
    },
    {
      key: 'athlete',
      header: 'Athlete',
      sortable: true,
      render: (value: any, row: AthleteRankingDTO) => (
        <div>
          <div className="font-medium text-gray-900">{row.athlete.name}</div>
          <div className="text-sm text-gray-500">
            #{row.athlete.jerseyNumber} • {formatPosition(row.athlete.position)}
          </div>
        </div>
      ),
    },
    {
      key: 'metric',
      header: 'Metric',
      sortable: true,
      render: (value: string, row: AthleteRankingDTO) => (
        <span className="text-gray-700">{formatMetricName(row.metric)}</span>
      ),
    },
    {
      key: 'value',
      header: 'Value',
      sortable: true,
      render: (value: number, row: AthleteRankingDTO) => (
        <span className="font-semibold text-gray-900">
          {formatValue(row.value, row.metric)}
        </span>
      ),
    },
  ];

  const formatPosition = (position: string): string => {
    return position.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const formatValue = (value: number, metric: string): string => {
    if (metric.includes('Efficiency') || metric.includes('Quality')) {
      return `${(value * 100).toFixed(1)}%`;
    }
    return value.toFixed(1);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando análises...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => loadAnalyticsData()}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!team || !statistics) {
    return null;
  }

  const chartData = prepareChartData();
  const metrics = getMetrics();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Team Analytics</h1>
              <p className="text-sm text-gray-600 mt-1">{team.name}</p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/coach/dashboard')}
              >
                Voltar para Painel
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Team Statistics Overview */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatisticsCard
              title="Total Matches"
              value={statistics.totalMatches || 0}
              subtitle={`${statistics.wins || 0}W - ${statistics.losses || 0}L`}
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              }
            />
            
            <StatisticsCard
              title="Attack Efficiency"
              value={`${((statistics.averageAttackEfficiency || 0) * 100).toFixed(1)}%`}
              subtitle="Team average"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            />
            
            <StatisticsCard
              title="Serve Efficiency"
              value={`${((statistics.averageServeEfficiency || 0) * 100).toFixed(1)}%`}
              subtitle="Team average"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            
            <StatisticsCard
              title="Reception Quality"
              value={`${((statistics.averageReceptionQuality || 0) * 100).toFixed(1)}%`}
              subtitle="Team average"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start date"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End date"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opponent
              </label>
              <Input
                type="text"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="Opponent team"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fundamental
              </label>
              <Select
                value={fundamental}
                onChange={(e) => setFundamental(e.target.value)}
                options={[
                  { value: '', label: 'All Fundamentals' },
                  { value: 'attack', label: 'Attack' },
                  { value: 'serve', label: 'Serve' },
                  { value: 'reception', label: 'Reception' },
                  { value: 'block', label: 'Block' },
                  { value: 'defense', label: 'Defense' },
                ]}
              />
            </div>
            
            <div className="flex items-end space-x-2">
              <Button onClick={handleApplyFilters} className="flex-1">
                Apply
              </Button>
              <Button 
                variant="outline" 
                onClick={handleResetFilters}
                className="flex-1"
              >
                Reset
              </Button>
            </div>
          </div>
        </Card>

        {/* Performance Trends Chart */}
        {chartData.length > 0 && metrics.length > 0 && (
          <div className="mb-8">
            <PerformanceChart
              data={chartData}
              xAxisKey="date"
              yAxisKeys={metrics}
              type="line"
              height={400}
              title="Performance Trends Over Time"
            />
          </div>
        )}

        {chartData.length === 0 && (
          <Card className="mb-8">
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-600">No trend data available for the selected filters</p>
            </div>
          </Card>
        )}

        {/* Team Roster with Individual Statistics */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Roster & Individual Statistics</h2>
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rankings.length > 0 ? (
                rankings.map((ranking) => (
                  <div
                    key={ranking.athlete.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/athletes/${ranking.athlete.id}`)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {ranking.athlete.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{ranking.athlete.name}</h3>
                          <p className="text-sm text-gray-500">Rank #{ranking.rank}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{ranking.value.toFixed(1)}</div>
                        <div className="text-xs text-gray-500 capitalize">{ranking.metric}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-600 text-xs">Position</div>
                        <div className="font-semibold">{ranking.athlete.position}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-600 text-xs">Jersey #</div>
                        <div className="font-semibold">{ranking.athlete.jerseyNumber}</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/athletes/${ranking.athlete.id}`);
                      }}
                      className="mt-3 w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Full Statistics →
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-600">No athlete data available</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Athlete Rankings Table */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detailed Athlete Rankings</h2>
          {rankings.length > 0 ? (
            <Card>
              <DataTable
                data={rankings}
                columns={rankingColumns}
              />
            </Card>
          ) : (
            <Card>
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-600">No ranking data available for the selected filters</p>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
