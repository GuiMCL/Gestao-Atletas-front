'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getTeam, getTeamStatistics } from '@/lib/api/team.api';
import { getMatches } from '@/lib/api/match.api';
import { StatisticsCard } from '@/components/ui/StatisticsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { TeamDTO, TeamStatisticsDTO, MatchSummaryDTO } from '@/types/athlete';

export default function CoachDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
  
  const [team, setTeam] = useState<TeamDTO | null>(null);
  const [statistics, setStatistics] = useState<TeamStatisticsDTO | null>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<MatchSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'COACH' && user.role !== 'ADMIN') {
      // Redirect non-coaches to appropriate dashboard
      router.push('/dashboard');
      return;
    }

    if (user) {
      loadDashboardData();
    }
  }, [user, isAuthenticated, authLoading, router]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Get all teams and use the first one
      // In a real implementation, we'd fetch the coach's team ID from their profile
      const { getAllTeams } = await import('@/lib/api/team.api');
      const teams = await getAllTeams();
      
      if (teams.length === 0) {
        setError('Nenhuma equipe encontrada. Por favor, entre em contato com um administrador.');
        setLoading(false);
        return;
      }

      const teamId = teams[0].id;

      // Fetch team details
      const teamData = await getTeam(teamId);
      setTeam(teamData);

      // Fetch team statistics
      const statsData = await getTeamStatistics(teamId);
      console.log('Team statistics loaded:', statsData);
      console.log('Total matches:', statsData.totalMatches);
      console.log('Wins:', statsData.wins, 'Losses:', statsData.losses);
      setStatistics(statsData);

      // Fetch upcoming matches (scheduled and in-progress)
      const matchesData = await getMatches({
        teamId,
        page: 1,
        pageSize: 5,
      });
      
      // Filter for upcoming matches (scheduled or in progress)
      const upcoming = matchesData.matches.filter(
        m => m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS'
      );
      setUpcomingMatches(upcoming);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Falha ao carregar os dados do painel. Por favor, tente novamente.');
    } finally {
      setLoading(false);
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
    switch (status) {
      case 'SCHEDULED':
        return 'Agendado';
      case 'IN_PROGRESS':
        return 'Em Andamento';
      case 'FINALIZED':
        return 'Finalizado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'FINALIZED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando painel...</p>
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
            <Button onClick={loadDashboardData}>Tentar novamente</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!team || !statistics) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Painel do Treinador</h1>
              <p className="text-sm text-gray-600 mt-1">{team.name}</p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/coach/matches')}
              >
                Jogos
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/coach/team/analytics')}
              >
                Análises da Equipe
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => router.push('/coach/matches/create')}
              className="h-24 flex flex-col items-center justify-center space-y-2"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-base font-medium">Criar Novo Jogo</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/coach/team/analytics')}
              className="h-24 flex flex-col items-center justify-center space-y-2"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-base font-medium">Ver Análises</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/coach/athletes')}
              className="h-24 flex flex-col items-center justify-center space-y-2"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-base font-medium">Gerenciar Atletas</span>
            </Button>
          </div>
        </div>

        {/* Team Statistics Overview */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Desempenho da Equipe</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatisticsCard
              title="Total de Jogos"
              value={statistics.totalMatches || 0}
              subtitle={`${statistics.wins || 0}W - ${statistics.losses || 0}L`}
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              }
            />
            
            <StatisticsCard
              title="Eficiência de Ataque"
              value={`${((statistics.averageAttackEfficiency || 0) * 100).toFixed(1)}%`}
              subtitle="Média da equipe"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            />
            
            <StatisticsCard
              title="Eficiência de Saque"
              value={`${((statistics.averageServeEfficiency || 0) * 100).toFixed(1)}%`}
              subtitle="Média da equipe"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            
            <StatisticsCard
              title="Registro de Sets"
              value={`${statistics.setsWon || 0}-${statistics.setsLost || 0}`}
              subtitle="Ganhos - Perdidos"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Upcoming Matches */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Próximos Jogos</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/coach/matches')}
            >
              Ver Todos os Jogos
            </Button>
          </div>

          {upcomingMatches.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600 mb-4">Nenhum jogo agendado</p>
                <Button onClick={() => router.push('/coach/matches/create')}>
                  Criar Novo Jogo
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingMatches.map((match) => (
                <Card
                  key={match.id}
                  hoverable
                  onClick={() => {
                    if (match.status === 'IN_PROGRESS') {
                      router.push(`/coach/matches/${match.id}/live`);
                    } else {
                      router.push(`/coach/matches/${match.id}`);
                    }
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="text-base font-semibold text-gray-900">
                          {match.homeTeam.name} vs {match.awayTeam.name}
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(match.status)}`}>
                          {formatMatchStatus(match.status)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(match.date)}
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {match.location}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {match.status === 'IN_PROGRESS' && (
                        <Button size="sm">
                          Ir para Jogo ao Vivo
                        </Button>
                      )}
                      {match.status === 'SCHEDULED' && (
                        <Button size="sm" variant="outline">
                          Ver Detalhes
                        </Button>
                      )}
                      <svg 
                        className="w-5 h-5 text-gray-400" 
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
        </div>
      </main>
    </div>
  );
}
