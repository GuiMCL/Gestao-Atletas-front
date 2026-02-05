'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getMatch, getMatchStatistics } from '@/lib/api/match.api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { exportMatchStatistics } from '@/lib/api/match.api';
import toast from 'react-hot-toast';
import type { MatchDTO, MatchStatisticsDTO, AthleteMatchStatisticsDTO } from '@/types/athlete';

export default function MatchFinalizePage() {
  const router = useRouter();
  const { id: matchId } = useParams();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const [match, setMatch] = useState<MatchDTO | null>(null);
  const [statistics, setStatistics] = useState<MatchStatisticsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'COACH' && user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    if (user && matchId) {
      loadMatchData();
    }
  }, [user, isAuthenticated, authLoading, router, matchId]);

  const loadMatchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [matchData, statsData] = await Promise.all([
        getMatch(matchId as string),
        getMatchStatistics(matchId as string)
      ]);
      
      setMatch(matchData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Error loading match data:', error);
      setError('Failed to load match data. Please try again.');
    } finally {
      setIsLoading(false);
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

  const getStatusBadgeVariant = (status: string): 'success' | 'info' | 'default' | 'error' => {
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

  const getTopPerformers = (stats: AthleteMatchStatisticsDTO[]): AthleteMatchStatisticsDTO[] => {
    return [...stats].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 3);
  };

  const getMostValuablePlayer = (stats: AthleteMatchStatisticsDTO[]): AthleteMatchStatisticsDTO | null => {
    if (stats.length === 0) return null;
    return stats.reduce((prev, current) => 
      (prev.totalPoints > current.totalPoints) ? prev : current
    );
  };

  const handleExport = async (format: 'pdf' | 'xlsx' | 'json') => {
    if (!matchId) return;
    
    try {
      setIsExporting(true);
      const blob = await exportMatchStatistics(matchId as string, format);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `match-${match?.homeTeam.name}-vs-${match?.awayTeam.name}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Estatísticas exportadas como ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting statistics:', error);
      toast.error('Falha ao exportar estatísticas');
    } finally {
      setIsExporting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados da partida...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <div className="text-center">
            <p className="text-red-600 mb-4">Partida não encontrada</p>
            <Button onClick={() => router.push('/coach/matches')}>
              Voltar para Partidas
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/coach/matches')}
                className="text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Voltar para Partidas
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">Resumo da Partida</h1>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                loading={isExporting}
              >
                Exportar PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('xlsx')}
                disabled={isExporting}
                loading={isExporting}
              >
                Exportar Excel
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('json')}
                disabled={isExporting}
                loading={isExporting}
              >
                Exportar JSON
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Match Summary */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {match.homeTeam.name} vs {match.awayTeam.name}
              </h2>
              <Badge variant={getStatusBadgeVariant(match.status)}>
                {formatMatchStatus(match.status)}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4L13 8l-5 5m0 0v4m0-4L3 8l5 5" />
                </svg>
                {formatDate(match.date)}
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {match.location}
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {match.sets?.length || 0} Sets
              </div>
            </div>
          </div>
        </Card>

        {/* Final Score */}
        {match.status === 'FINALIZED' && match.sets && match.sets.length > 0 && (
          <Card className="mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Placar Final</h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {match.sets.filter(set => set.status === 'FINALIZED').reduce((homeScore, set) => homeScore + (set.homeScore > set.awayScore ? 1 : 0), 0)} - 
                  {match.sets.filter(set => set.status === 'FINALIZED').reduce((awayScore, set) => awayScore + (set.awayScore > set.homeScore ? 1 : 0), 0)}
                </div>
                <p className="text-sm text-gray-500">Resultado final da partida</p>
              </div>
            </div>
          </Card>
        )}

        {/* Set-by-Set Results */}
        {match.sets && match.sets.length > 0 && (
          <Card className="mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultados por Set</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {match.sets.map((set, index) => {
                  const homeWon = set.homeScore > set.awayScore;
                  const awayWon = set.awayScore > set.homeScore;
                  return (
                    <div 
                      key={set.id}
                      className={`text-center p-4 rounded-lg border-2 ${
                        set.status === 'FINALIZED' 
                          ? 'bg-green-50 border-green-300' 
                          : homeWon 
                            ? 'bg-blue-50 border-blue-300'
                            : awayWon
                              ? 'bg-red-50 border-red-300'
                              : 'bg-gray-50 border-gray-300'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-600 mb-2">Set {set.setNumber}</div>
                      <div className="text-2xl font-bold mb-2">
                        <span className={homeWon ? 'text-green-600' : 'text-gray-900'}>{set.homeScore}</span>
                        <span className="text-gray-400 mx-1">-</span>
                        <span className={awayWon ? 'text-green-600' : 'text-gray-900'}>{set.awayScore}</span>
                      </div>
                      <Badge variant="success" size="sm">
                        Finalizado
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* MVP Highlight */}
        {statistics?.athleteStatistics && statistics.athleteStatistics.length > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h3 className="text-2xl font-bold text-yellow-900">Destaque da Partida</h3>
              </div>
              {getMostValuablePlayer(statistics.athleteStatistics) && (
                <div className="text-center">
                  <p className="text-sm text-yellow-700 mb-2">MVP - Jogador Mais Valioso</p>
                  <p className="text-3xl font-bold text-yellow-900 mb-2">
                    {getMostValuablePlayer(statistics.athleteStatistics)?.athleteName}
                  </p>
                  <div className="flex justify-center gap-8 mt-4">
                    <div className="text-center">
                      <p className="text-sm text-yellow-700">Pontos Totais</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {getMostValuablePlayer(statistics.athleteStatistics)?.totalPoints}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-yellow-700">Ataques</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {getMostValuablePlayer(statistics.athleteStatistics)?.attacks.points}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-yellow-700">Bloqueios</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {getMostValuablePlayer(statistics.athleteStatistics)?.blocks.points}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Top Performers */}
        {statistics?.athleteStatistics && statistics.athleteStatistics.length > 0 && (
          <Card className="mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 3 Melhores Desempenhos</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {getTopPerformers(statistics.athleteStatistics).map((athlete, index) => (
                  <div 
                    key={athlete.athleteId}
                    className={`p-4 rounded-lg border-2 ${
                      index === 0 
                        ? 'bg-yellow-50 border-yellow-300' 
                        : index === 1 
                          ? 'bg-gray-100 border-gray-300'
                          : 'bg-orange-50 border-orange-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{athlete.athleteName}</h4>
                      <span className={`text-2xl font-bold ${
                        index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-600' : 'text-orange-600'
                      }`}>
                        #{index + 1}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pontos:</span>
                        <span className="font-semibold text-gray-900">{athlete.totalPoints}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ataques:</span>
                        <span className="font-semibold text-gray-900">{athlete.attacks.points}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bloqueios:</span>
                        <span className="font-semibold text-gray-900">{athlete.blocks.points}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Saques:</span>
                        <span className="font-semibold text-gray-900">{athlete.serves.aces}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Athletes Performance - Detailed Table */}
        {statistics?.athleteStatistics && statistics.athleteStatistics.length > 0 && (
          <Card className="mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Desempenho Completo dos Atletas</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Atleta
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pontos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Saques
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ataques
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bloqueios
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recepções
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Defesas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {statistics.athleteStatistics.map((athlete) => (
                      <tr key={athlete.athleteId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {athlete.athleteName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {athlete.totalPoints}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {athlete.serves.total} ({athlete.serves.aces} aces)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {athlete.attacks.total} ({athlete.attacks.points} pts)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {athlete.blocks.total} ({athlete.blocks.points} pts)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {athlete.receptions.total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {athlete.defenses.total} ({athlete.defenses.success} ok)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}

        {/* Team Statistics Comparison */}
        {statistics?.teamStatistics && (
          <Card className="mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Estatísticas Gerais da Partida</h3>
              
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-blue-900">Pontuação Total</h4>
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-blue-900">{statistics.teamStatistics.totalPoints}</p>
                  <p className="text-xs text-blue-700 mt-1">Pontos marcados durante a partida</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-green-900">Eficiência de Ataque</h4>
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h.01a1 1 0 110 2H12zm-2 2a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2zm2-4a1 1 0 11-2 0 1 1 0 012 0zm-6 4a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-green-900">
                    {(statistics.teamStatistics.attackEfficiency * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-green-700 mt-1">Taxa de sucesso nos ataques</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-yellow-900">Eficiência de Saque</h4>
                    <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-yellow-900">
                    {(statistics.teamStatistics.serveEfficiency * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">Taxa de sucesso nos saques</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-purple-900">Pontos de Bloqueio</h4>
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-purple-900">{statistics.teamStatistics.blockPoints}</p>
                  <p className="text-xs text-purple-700 mt-1">Pontos conquistados em bloqueios</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-red-900">Total de Erros</h4>
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-red-900">{statistics.teamStatistics.totalErrors}</p>
                  <p className="text-xs text-red-700 mt-1">Erros cometidos durante a partida</p>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-indigo-900">Qualidade de Recepção</h4>
                    <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-indigo-900">
                    {(statistics.teamStatistics.receptionQuality * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-indigo-700 mt-1">Qualidade das recepções</p>
                </div>
              </div>

              {/* Performance Bars */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Eficiência de Ataque</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {(statistics.teamStatistics.attackEfficiency * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(statistics.teamStatistics.attackEfficiency * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Eficiência de Saque</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {(statistics.teamStatistics.serveEfficiency * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(statistics.teamStatistics.serveEfficiency * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Qualidade de Recepção</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {(statistics.teamStatistics.receptionQuality * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(statistics.teamStatistics.receptionQuality * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
