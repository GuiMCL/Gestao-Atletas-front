'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getMatches, startMatch } from '@/lib/api/match.api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { MatchSummaryDTO, MatchStatus } from '@/types/athlete';

type StatusFilter = 'ALL' | MatchStatus;

export default function MatchManagementPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const [matches, setMatches] = useState<MatchSummaryDTO[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<MatchSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [startingMatchId, setStartingMatchId] = useState<string | null>(null);

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
      loadMatches();
    }
  }, [user, isAuthenticated, authLoading, router]);

  useEffect(() => {
    // Apply filter whenever matches or filter changes
    if (statusFilter === 'ALL') {
      setFilteredMatches(matches);
    } else {
      setFilteredMatches(matches.filter(m => m.status === statusFilter));
    }
  }, [matches, statusFilter]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the coach's team ID from their profile
      const teamId = user?.teamId;

      const matchesData = await getMatches({
        teamId,
        page: 1,
        pageSize: 100, // Get all matches
      });

      // Sort matches by date (most recent first)
      const sortedMatches = matchesData.matches.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setMatches(sortedMatches);
    } catch (err) {
      console.error('Error loading matches:', err);
      setError('Falha ao carregar partidas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartMatch = async (matchId: string) => {
    try {
      setStartingMatchId(matchId);
      setError(null);

      const result = await startMatch(matchId);

      // Navigate to live match page
      router.push(`/coach/matches/${matchId}/live`);
    } catch (err) {
      console.error('Error starting match:', err);
      setError(err instanceof Error ? err.message : 'Falha ao iniciar partida. Tente novamente.');
      setStartingMatchId(null);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
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

  const getStatusBadgeVariant = (status: MatchStatus): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'SCHEDULED':
        return 'default';
      case 'IN_PROGRESS':
        return 'info';
      case 'FINALIZED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleMatchClick = (match: MatchSummaryDTO) => {
    if (match.status === 'IN_PROGRESS') {
      router.push(`/coach/matches/${match.id}/live`);
    } else {
      router.push(`/coach/matches/${match.id}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando partidas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Optimized for tablets */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between flex-wrap gap-3 md:gap-0">
            <div className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => router.push('/coach/dashboard')}
                className="mr-2 md:mr-4 text-gray-600 hover:text-gray-900 touch-manipulation p-1"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">Gerenciamento de Partidas</h1>
                <p className="text-xs md:text-sm text-gray-600 mt-1 truncate">
                  {filteredMatches.length} {filteredMatches.length === 1 ? 'partida' : 'partidas'}
                  {statusFilter !== 'ALL' && ` (${formatMatchStatus(statusFilter)})`}
                </p>
              </div>
            </div>
            <Button onClick={() => router.push('/coach/matches/create')} size="sm" className="md:text-base">
              <svg className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Criar Nova Partida</span>
              <span className="sm:hidden">Criar</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Filters - Optimized for tablets */}
        <div className="mb-4 md:mb-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === 'ALL' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('ALL')}
              className="text-xs md:text-sm"
            >
              Todas as Partidas
            </Button>
            <Button
              variant={statusFilter === 'SCHEDULED' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('SCHEDULED')}
              className="text-xs md:text-sm"
            >
              Agendadas
            </Button>
            <Button
              variant={statusFilter === 'IN_PROGRESS' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className="text-xs md:text-sm"
            >
              Em Andamento
            </Button>
            <Button
              variant={statusFilter === 'FINALIZED' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('FINALIZED')}
              className="text-xs md:text-sm"
            >
              Finalizadas
            </Button>
            <Button
              variant={statusFilter === 'CANCELLED' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('CANCELLED')}
              className="text-xs md:text-sm"
            >
              Canceladas
            </Button>
          </div>
        </div>

        {/* Matches List */}
        {filteredMatches.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-600 mb-4">
                {statusFilter === 'ALL'
                  ? 'Nenhuma partida encontrada'
                  : `Nenhuma partida ${formatMatchStatus(statusFilter).toLowerCase()}`}
              </p>
              {statusFilter === 'ALL' && (
                <Button onClick={() => router.push('/coach/matches/create')}>
                  Criar Sua Primeira Partida
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {filteredMatches.map((match) => (
              <Card
                key={match.id}
                hoverable
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between flex-wrap md:flex-nowrap gap-3">
                  <div
                    className="flex-1 min-w-0"
                    onClick={() => handleMatchClick(match)}
                  >
                    <div className="flex items-center space-x-2 md:space-x-4 mb-2 md:mb-3 flex-wrap">
                      <div className="text-base md:text-lg font-semibold text-gray-900 truncate">
                        {match.homeTeam.name} vs {match.awayTeam.name}
                      </div>
                      <Badge
                        variant={getStatusBadgeVariant(match.status)}
                        size="sm"
                      >
                        {formatMatchStatus(match.status)}
                      </Badge>
                    </div>

                    <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs md:text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{formatDate(match.date)}</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{match.location}</span>
                      </div>
                      {match.finalScore && (
                        <div className="flex items-center font-medium text-gray-900">
                          <svg className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          Final: {match.finalScore}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 md:space-x-3 ml-auto">
                    {match.status === 'SCHEDULED' && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartMatch(match.id);
                        }}
                        loading={startingMatchId === match.id}
                        disabled={startingMatchId === match.id}
                        className="text-xs md:text-sm"
                      >
                        <span className="hidden sm:inline">Iniciar Partida</span>
                        <span className="sm:hidden">Iniciar</span>
                      </Button>
                    )}

                    {match.status === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/coach/matches/${match.id}/live`);
                        }}
                        className="text-xs md:text-sm"
                      >
                        <span className="hidden sm:inline">Ir para Partida ao Vivo</span>
                        <span className="sm:hidden">Ao Vivo</span>
                      </Button>
                    )}

                    {match.status === 'FINALIZED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/coach/matches/${match.id}`);
                        }}
                        className="text-xs md:text-sm"
                      >
                        <span className="hidden sm:inline">Ver Relatório</span>
                        <span className="sm:hidden">Ver</span>
                      </Button>
                    )}

                    <svg
                      className="w-4 h-4 md:w-5 md:h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
