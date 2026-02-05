'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getMatchDetail } from '@/lib/api/athlete.api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatisticsCard } from '@/components/ui/StatisticsCard';
import { PerformanceChart } from '@/components/ui/PerformanceChart';
import { MobileNav } from '@/components/ui/MobileNav';
import type {
  MatchDetailResponse,
  MatchStatus,
  AthleteMatchStatisticsDTO
} from '@/types/athlete';

// Icons as components
const IconTrendingUp = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const IconTarget = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const IconCheckCircle = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconShield = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

export default function MatchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.id as string;
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const [matchData, setMatchData] = useState<MatchDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState<number | 'all'>('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'ATHLETE') {
      router.push('/');
      return;
    }

    if (user && matchId) {
      loadMatchDetail();
    }
  }, [user, isAuthenticated, authLoading, router, matchId]);

  const loadMatchDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getMatchDetail(matchId);
      setMatchData(data);
    } catch (err) {
      console.error('Error loading match details:', err);
      setError('Falha ao carregar detalhes da partida. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMatchStatus = (status: string): string => {
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getStatusBadgeVariant = (status: MatchStatus): 'success' | 'info' | 'default' | 'error' => {
    switch (status) {
      case 'FINALIZED':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      case 'SCHEDULED':
        return 'default';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const calculateEfficiency = (points: number, errors: number, total: number): number => {
    if (total === 0) return 0;
    return ((points - errors) / total) * 100;
  };

  const calculateServeEfficiency = (aces: number, points: number, total: number): number => {
    if (total === 0) return 0;
    return ((aces + points) / total) * 100;
  };

  const calculateReceptionQuality = (receptions: { a: number; b: number; c: number; d: number }): number => {
    const total = receptions.a + receptions.b + receptions.c + receptions.d;
    if (total === 0) return 0;
    // Weighted average: A=4, B=3, C=2, D=1
    const weighted = (receptions.a * 4 + receptions.b * 3 + receptions.c * 2 + receptions.d * 1);
    return (weighted / (total * 4)) * 100;
  };

  const getFilteredStatistics = (): AthleteMatchStatisticsDTO | null => {
    if (!matchData) return null;

    if (selectedSet === 'all') {
      return matchData.personalStatistics;
    }

    if (!matchData.statistics || !matchData.statistics.setStatistics) return null;

    const setStats = matchData.statistics.setStatistics.find(s => s.setNumber === selectedSet);
    if (!setStats || !setStats.athleteStatistics) return null;

    return setStats.athleteStatistics.find(a => a.athleteId === user?.id) || null;
  };

  const prepareChartData = () => {
    if (!matchData || !matchData.statistics || !matchData.statistics.setStatistics) return [];

    return matchData.statistics.setStatistics
      .map(set => {
        const athleteStats = set.athleteStatistics?.find(a => a.athleteId === user?.id);
        if (!athleteStats) return null;

        return {
          set: `Set ${set.setNumber}`,
          attackEfficiency: calculateEfficiency(
            athleteStats.attacks?.points || 0,
            athleteStats.attacks?.errors || 0,
            athleteStats.attacks?.total || 0
          ),
          serveEfficiency: calculateServeEfficiency(
            athleteStats.serves?.aces || 0,
            0,
            athleteStats.serves?.total || 0
          ),
          totalPoints: athleteStats.totalPoints || 0,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando detalhes do jogo...</p>
        </div>
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Jogo não encontrado'}</p>
            <Button onClick={() => router.push('/matches')}>Voltar aos Jogos</Button>
          </div>
        </Card>
      </div>
    );
  }

  const filteredStats = getFilteredStatistics();
  const chartData = prepareChartData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile Optimized */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">Detalhes do Jogo</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                {matchData.match.homeTeam?.name || 'Unknown'} vs {matchData.match.awayTeam?.name || 'Unknown'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/matches')}
              className="flex-shrink-0 text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Voltar aos Jogos</span>
              <span className="sm:hidden">Voltar</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20 md:pb-8">
        {/* Match Information - Enhanced Header */}
        <Card className="mb-6 sm:mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg" padding="md">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {matchData.match.homeTeam?.name || 'Unknown'} vs {matchData.match.awayTeam?.name || 'Unknown'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{formatDate(matchData.match.date)}</p>
              </div>
              <Badge variant={getStatusBadgeVariant(matchData.match.status)} className="w-fit text-base px-4 py-2">
                {formatMatchStatus(matchData.match.status)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-600 mb-1 font-semibold">Localização</p>
                <p className="font-semibold text-gray-900 text-sm">{matchData.match.location}</p>
              </div>
              {matchData.match.finalScore && (
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 col-span-2 sm:col-span-1">
                  <p className="text-xs text-gray-600 mb-1 font-semibold">Placar Final</p>
                  <p className="font-bold text-blue-600 text-lg">{matchData.match.finalScore}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Set Scores - Enhanced Grid */}
        <Card className="mb-6 sm:mb-8 shadow-lg" padding="md">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Placares por Set</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {matchData.match.sets.map((set) => (
              <div
                key={set.id}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 text-center border-2 border-gray-200 hover:border-blue-400 transition-all cursor-pointer hover:shadow-lg"
              >
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Set {set.setNumber}</div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {set.homeScore} - {set.awayScore}
                </div>
                {set.status === 'FINALIZED' && (
                  <Badge variant="success" size="sm" className="justify-center w-full">
                    Finalizado
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Filter and Personal Performance Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Desempenho Pessoal</h3>
          <div className="flex items-center space-x-3 bg-white rounded-lg p-3 shadow-md border border-gray-200">
            <span className="text-sm font-medium text-gray-700">Visualizar:</span>
            <select
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">Todos os Sets</option>
              {matchData.match.sets.map((set) => (
                <option key={set.id} value={set.setNumber}>
                  Set {set.setNumber}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Personal Statistics Cards - Enhanced */}
        {filteredStats && (
          <>
            {/* Summary Cards - 4 Column Grid with Gradients */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-400 bg-opacity-30 rounded-lg p-3">
                    <IconTrendingUp />
                  </div>
                  <span className="text-xs font-semibold bg-blue-400 bg-opacity-30 px-3 py-1 rounded-full">Total</span>
                </div>
                <p className="text-sm text-blue-100 mb-1">Pontos Totais</p>
                <p className="text-4xl font-bold">{filteredStats.totalPoints?.toString() || '0'}</p>
              </div>

              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-indigo-400 bg-opacity-30 rounded-lg p-3">
                    <IconTarget />
                  </div>
                  <span className="text-xs font-semibold bg-indigo-400 bg-opacity-30 px-3 py-1 rounded-full">Ataque</span>
                </div>
                <p className="text-sm text-indigo-100 mb-1">Eficiência de Ataque</p>
                <p className="text-4xl font-bold">
                  {calculateEfficiency(
                    filteredStats.attacks?.points || 0,
                    filteredStats.attacks?.errors || 0,
                    filteredStats.attacks?.total || 0
                  ).toFixed(1)}%
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-400 bg-opacity-30 rounded-lg p-3">
                    <IconCheckCircle />
                  </div>
                  <span className="text-xs font-semibold bg-green-400 bg-opacity-30 px-3 py-1 rounded-full">Serviço</span>
                </div>
                <p className="text-sm text-green-100 mb-1">Eficiência de Serviço</p>
                <p className="text-4xl font-bold">
                  {calculateServeEfficiency(
                    filteredStats.serves?.aces || 0,
                    filteredStats.serves?.errors || 0,
                    filteredStats.serves?.total || 0
                  ).toFixed(1)}%
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-400 bg-opacity-30 rounded-lg p-3">
                    <IconShield />
                  </div>
                  <span className="text-xs font-semibold bg-purple-400 bg-opacity-30 px-3 py-1 rounded-full">Bloqueio</span>
                </div>
                <p className="text-sm text-purple-100 mb-1">Pontos de Bloqueio</p>
                <p className="text-4xl font-bold">{(filteredStats.blocks?.points || 0).toString()}</p>
              </div>
            </div>

            {/* Detailed Breakdown - 3 Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Attack Details */}
              <Card padding="sm">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Detalhes do Ataque
                </h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-600">Total de Ataques:</dt>
                    <dd className="font-semibold text-gray-900">{filteredStats.attacks?.total || 0}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-600">Pontos:</dt>
                    <dd className="font-semibold text-green-600">{filteredStats.attacks?.points || 0}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-600">Errors:</dt>
                    <dd className="font-semibold text-red-600">{filteredStats.attacks?.errors || 0}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-600">Bloqueados:</dt>
                    <dd className="font-semibold text-orange-600">{filteredStats.attacks?.blocked || 0}</dd>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-700 font-medium">Efficiency:</dt>
                      <dd className="font-bold text-blue-600">
                        {calculateEfficiency(
                          filteredStats.attacks?.points || 0,
                          filteredStats.attacks?.errors || 0,
                          filteredStats.attacks?.total || 0
                        ).toFixed(1)}%
                      </dd>
                    </div>
                  </div>
                </dl>
              </Card>

              {/* Serve Details */}
              <Card padding="sm">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Detalhes do Saque
                </h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-600">Total de Serviços:</dt>
                    <dd className="font-semibold text-gray-900">{filteredStats.serves?.total || 0}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-600">Aces:</dt>
                    <dd className="font-semibold text-green-600">{filteredStats.serves?.aces || 0}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-600">Errors:</dt>
                    <dd className="font-semibold text-red-600">{filteredStats.serves?.errors || 0}</dd>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-700 font-medium">Efficiency:</dt>
                      <dd className="font-bold text-green-600">
                        {calculateServeEfficiency(
                          filteredStats.serves?.aces || 0,
                          filteredStats.serves?.errors || 0,
                          filteredStats.serves?.total || 0
                        ).toFixed(1)}%
                      </dd>
                    </div>
                  </div>
                </dl>
              </Card>

              {/* Block Details */}
              <Card padding="sm">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Detalhes do Bloqueio
                </h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-600">Total de Bloqueios:</dt>
                    <dd className="font-semibold text-gray-900">{filteredStats.blocks?.total || 0}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-600">Pontos de Bloqueio:</dt>
                    <dd className="font-semibold text-green-600">{filteredStats.blocks?.points || 0}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-600">Toques de Bloqueio:</dt>
                    <dd className="font-semibold text-blue-600">{filteredStats.blocks?.touches || 0}</dd>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-700 font-medium">Efficiency:</dt>
                      <dd className="font-bold text-purple-600">
                        {filteredStats.blocks?.total ?
                          ((filteredStats.blocks.points / filteredStats.blocks.total) * 100).toFixed(1) : '0.0'}%
                      </dd>
                    </div>
                  </div>
                </dl>
              </Card>

              {/* Reception Details */}
              {filteredStats.receptions && filteredStats.receptions.total > 0 && (
                <Card padding="sm">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    </svg>
                    Detalhes da Recepção
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-600">Total de Recepções:</dt>
                      <dd className="font-semibold text-gray-900">{filteredStats.receptions.total}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-600">Perfeita (A):</dt>
                      <dd className="font-semibold text-green-600">{filteredStats.receptions.perfect || 0}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-600">Boa (B):</dt>
                      <dd className="font-semibold text-blue-600">{filteredStats.receptions.good || 0}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-600">Ruim (C):</dt>
                      <dd className="font-semibold text-orange-600">{filteredStats.receptions.poor || 0}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-600">Erro (D):</dt>
                      <dd className="font-semibold text-red-600">{filteredStats.receptions.error || 0}</dd>
                    </div>
                  </dl>
                </Card>
              )}

              {/* Defense Details */}
              {filteredStats.defenses && filteredStats.defenses.total > 0 && (
                <Card padding="sm">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Detalhes da Defesa
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-600">Total de Defesas:</dt>
                      <dd className="font-semibold text-gray-900">{filteredStats.defenses.total}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-600">Bem-sucedidas:</dt>
                      <dd className="font-semibold text-green-600">{filteredStats.defenses.success || 0}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-600">Falhas:</dt>
                      <dd className="font-semibold text-red-600">{filteredStats.defenses.fail || 0}</dd>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <dt className="text-gray-700 font-medium">Taxa de Sucesso:</dt>
                        <dd className="font-bold text-yellow-600">
                          {filteredStats.defenses.total ?
                            ((filteredStats.defenses.success / filteredStats.defenses.total) * 100).toFixed(1) : '0.0'}%
                        </dd>
                      </div>
                    </div>
                  </dl>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Performance Charts - Full Width */}
        {chartData.length > 1 && (
          <Card padding="md" className="shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Desempenho por Set</h3>
            <div className="h-80 w-full">
              <PerformanceChart
                data={chartData}
                xAxisKey="set"
                yAxisKeys={[
                  { key: 'attackEfficiency', name: 'Ef. Ataque (%)', color: '#3b82f6' },
                  { key: 'serveEfficiency', name: 'Ef. Serviço (%)', color: '#10b981' },
                  { key: 'totalPoints', name: 'Pontos', color: '#f59e0b' },
                ]}
                type="line"
                height={320}
              />
            </div>
          </Card>
        )}
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
