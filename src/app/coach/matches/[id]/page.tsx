'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getMatch } from '@/lib/api/match.api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { MatchDTO, MatchStatus } from '@/types/athlete';

export default function CoachMatchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.id as string;
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const [matchData, setMatchData] = useState<MatchDTO | null>(null);
  const [loading, setLoading] = useState(true);
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
      loadMatchDetail();
    }
  }, [user, isAuthenticated, authLoading, router, matchId]);

  const loadMatchDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getMatch(matchId);
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando detalhes da partida...</p>
        </div>
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Partida não encontrada'}</p>
            <Button onClick={() => router.push('/coach/matches')}>Voltar para Partidas</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="secondary"
            onClick={() => router.push('/coach/matches')}
            className="mb-4 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para Partidas
          </Button>
          
          <Card className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <h1 className="text-3xl font-bold">Detalhes da Partida</h1>
                </div>
                <p className="text-xl font-semibold text-blue-100 mb-1">
                  {matchData.homeTeam.name} vs {matchData.awayTeam.name}
                </p>
                <div className="flex items-center space-x-4 text-sm text-blue-200">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(matchData.date)}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {matchData.location}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Badge variant={getStatusBadgeVariant(matchData.status)} className="text-lg px-4 py-2">
                  {formatMatchStatus(matchData.status)}
                </Badge>
                {matchData.status === 'SCHEDULED' && (
                  <Button 
                    onClick={() => router.push(`/coach/matches/${matchId}/live`)}
                    className="bg-white text-blue-600 hover:bg-blue-50"
                  >
                    Iniciar Partida
                  </Button>
                )}
                {matchData.status === 'IN_PROGRESS' && (
                  <Button 
                    onClick={() => router.push(`/coach/matches/${matchId}/live`)}
                    className="bg-white text-blue-600 hover:bg-blue-50"
                  >
                    Ir para Partida ao Vivo
                  </Button>
                )}
                {matchData.status === 'FINALIZED' && (
                  <Button 
                    onClick={() => router.push(`/coach/matches/${matchId}/finalize`)}
                    className="bg-white text-blue-600 hover:bg-blue-50"
                  >
                    Ver Relatório Completo
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

      <main className="max-w-7xl mx-auto">
        {/* Match Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Time da Casa</p>
                <p className="text-lg font-bold text-blue-900">{matchData.homeTeam.name}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Status</p>
                <p className="text-lg font-bold text-purple-900">{formatMatchStatus(matchData.status)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Time Visitante</p>
                <p className="text-lg font-bold text-green-900">{matchData.awayTeam.name}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Set-by-Set Scores */}
        {matchData.sets && matchData.sets.length > 0 && (
          <Card className="p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Placar por Set
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {matchData.sets.map((set, index) => {
                const homeWon = set.homeScore > set.awayScore;
                const awayWon = set.awayScore > set.homeScore;
                return (
                  <div 
                    key={set.id}
                    className={`text-center p-6 rounded-lg border-2 transition-all ${
                      set.status === 'IN_PROGRESS' 
                        ? 'bg-blue-50 border-blue-400 shadow-lg' 
                        : homeWon 
                          ? 'bg-green-50 border-green-300'
                          : awayWon
                            ? 'bg-red-50 border-red-300'
                            : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-semibold text-gray-600 mb-2">Set {set.setNumber}</div>
                    <div className="text-3xl font-bold mb-2">
                      <span className={homeWon ? 'text-green-600' : 'text-gray-900'}>{set.homeScore}</span>
                      <span className="text-gray-400 mx-2">-</span>
                      <span className={awayWon ? 'text-green-600' : 'text-gray-900'}>{set.awayScore}</span>
                    </div>
                    {set.status === 'FINALIZED' && (
                      <Badge variant="success" size="sm">
                        Finalizado
                      </Badge>
                    )}
                    {set.status === 'IN_PROGRESS' && (
                      <Badge variant="info" size="sm" className="animate-pulse">
                        Ao Vivo
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Athletes Roster */}
        {matchData.athletes && matchData.athletes.length > 0 && (
          <Card className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Escalação do Time ({matchData.athletes.length} Atletas)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {matchData.athletes.map((athlete) => (
                <div 
                  key={athlete.id}
                  className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => router.push(`/athletes/${athlete.id}`)}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {athlete.jerseyNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{athlete.name}</p>
                      <p className="text-sm text-gray-600">{athlete.position}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Empty State for Scheduled Matches */}
        {matchData.status === 'SCHEDULED' && (!matchData.sets || matchData.sets.length === 0) && (
          <Card className="p-6">
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-blue-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600 mb-4 text-lg">Esta partida ainda não começou</p>
              <Button onClick={() => router.push(`/coach/matches/${matchId}/live`)}>
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Iniciar Partida
              </Button>
            </div>
          </Card>
        )}
      </main>
      </div>
    </div>
  );
}
