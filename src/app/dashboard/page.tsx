'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getAthleteProfile, getAthleteMatches } from '@/lib/api/athlete.api';
import { getUnreadNotificationCount } from '@/lib/api/notification.api';
import { StatisticsCard } from '@/components/ui/StatisticsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MobileNav } from '@/components/ui/MobileNav';
import type { AthleteDTO, AthleteStatisticsDTO, MatchSummaryDTO } from '@/types/athlete';

export default function AthleteDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
  
  const [athlete, setAthlete] = useState<AthleteDTO | null>(null);
  const [statistics, setStatistics] = useState<AthleteStatisticsDTO | null>(null);
  const [recentMatches, setRecentMatches] = useState<MatchSummaryDTO[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'ATHLETE') {
      // Redirect non-athletes to appropriate dashboard
      if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (user.role === 'COACH') {
        router.push('/coach/dashboard');
      } else {
        router.push('/');
      }
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

      // Only load athlete data if user is an athlete
      if (user.role === 'ATHLETE') {
        // Import the new function
        const { getMyAthleteProfile } = await import('@/lib/api/athlete.api');
        
        // Fetch athlete profile using the /me endpoint
        const profileData = await getMyAthleteProfile();
        
        console.log('Profile data received:', profileData);
        console.log('Athlete data:', profileData?.athlete);
        console.log('Statistics data:', profileData?.statistics);
        
        if (!profileData) {
          throw new Error('No profile data received from server');
        }
        
        if (!profileData.athlete) {
          throw new Error('Athlete data is missing from profile response');
        }
        
        if (!profileData.athlete.name) {
          throw new Error('Athlete name is missing from profile data');
        }
        
        setAthlete(profileData.athlete);
        setStatistics(profileData.statistics);

        // Fetch recent matches using the athlete ID
        const matchesData = await getAthleteMatches(profileData.athlete.id, 1, 5);
        setRecentMatches(matchesData.matches);
      }

      // Fetch unread notification count
      try {
        const count = await getUnreadNotificationCount();
        setUnreadNotifications(count);
      } catch (notifErr) {
        console.error('Error loading notification count:', notifErr);
        // Don't fail the whole dashboard if notifications fail
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Falha ao carregar dados do painel';
      setError(`${errorMessage}. Tente novamente ou entre em contato com o suporte se o problema persistir.`);
    } finally {
      setLoading(false);
    }
  };

  const formatPosition = (position: string): string => {
    return position.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatMatchStatus = (status: string): string => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
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

  if (!athlete || !statistics || !athlete.name) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando perfil do atleta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile Optimized */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
Painel do Atleta
            </h1>
            <div className="flex space-x-1 sm:space-x-2">
              {/* Mobile: Icon only, Desktop: Icon + Text */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/notifications')}
                className="relative px-2 sm:px-3"
                aria-label="Notifications"
              >
                <svg 
                  className="w-5 h-5 sm:mr-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
                  />
                </svg>
                <span className="hidden sm:inline">Notificações</span>
                {unreadNotifications > 0 && (
                  <Badge 
                    variant="info" 
                    className="ml-0 sm:ml-2 absolute -top-1 -right-1 sm:relative sm:top-0 sm:right-0 min-w-[20px] h-5 flex items-center justify-center text-xs px-1"
                  >
                    {unreadNotifications}
                  </Badge>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/profile')}
                className="hidden sm:inline-flex"
              >
Meu Perfil
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/profile')}
                className="sm:hidden px-2"
                aria-label="Profile"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="hidden md:inline-flex"
              >
Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20 md:pb-8">
        {/* Profile Section - Mobile Optimized */}
        <Card className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Profile Photo */}
            <div className="flex-shrink-0">
              {athlete?.photoUrl ? (
                <img
                  src={athlete.photoUrl}
                  alt={athlete.name || 'Athlete'}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-blue-100"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-200">
                  <span className="text-2xl sm:text-3xl font-bold text-blue-600">
                    {athlete?.name?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left w-full">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{athlete?.name || 'Unknown Athlete'}</h2>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Posição:</span> {athlete?.position ? formatPosition(athlete.position) : 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Camisa:</span> #{athlete?.jerseyNumber || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Total de Partidas:</span> {statistics?.totalMatches || 0}
                </div>
              </div>
              {athlete?.bio && (
                <p className="mt-3 text-sm sm:text-base text-gray-700">{athlete.bio}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Statistics Cards - Mobile Optimized */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 px-1">Estatísticas de Desempenho</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatisticsCard
              title="Eficiência de Ataque"
              value={`${(statistics.attackEfficiency * 100).toFixed(1)}%`}
              subtitle={`${statistics.totalPoints} pontos totais`}
              icon={
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            />
            
            <StatisticsCard
              title="Eficiência de Saque"
              value={`${(statistics.serveEfficiency * 100).toFixed(1)}%`}
              subtitle="Aces e pontos"
              icon={
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            
            <StatisticsCard
              title="Qualidade de Recepção"
              value={statistics.receptionQuality.toFixed(2)}
              subtitle="Média de notas"
              icon={
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                </svg>
              }
            />
            
            <StatisticsCard
              title="Eficiência de Bloqueio"
              value={`${(statistics.blockEfficiency * 100).toFixed(1)}%`}
              subtitle="Bloqueios bem-sucedidos"
              icon={
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4">
            <StatisticsCard
              title="Total de Sets Jogados"
              value={statistics.totalSets}
            />
            
            <StatisticsCard
              title="Média de Pontos/Set"
              value={statistics.averagePointsPerSet.toFixed(1)}
            />
            
            <StatisticsCard
              title="Total de Erros"
              value={statistics.totalErrors}
            />
          </div>
        </div>

        {/* Recent Matches - Mobile Optimized */}
        <div>
          <div className="flex justify-between items-center mb-3 sm:mb-4 px-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Partidas Recentes</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/matches')}
              className="text-xs sm:text-sm"
            >
Ver Tudo
            </Button>
          </div>

          {recentMatches.length === 0 ? (
            <Card>
              <p className="text-center text-gray-600 py-6 sm:py-8 text-sm sm:text-base">Nenhuma partida encontrada</p>
            </Card>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentMatches.map((match) => (
                <Card
                  key={match.id}
                  hoverable
                  onClick={() => router.push(`/matches/${match.id}`)}
                  className="cursor-pointer active:scale-[0.98] transition-transform"
                  padding="sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                        <div className="text-sm sm:text-base font-medium text-gray-900 truncate">
                          {match.homeTeam?.name || 'Desconhecido'} vs {match.awayTeam?.name || 'Desconhecido'}
                        </div>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full inline-block w-fit ${
                          match.status === 'FINALIZED' 
                            ? 'bg-green-100 text-green-800'
                            : match.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {formatMatchStatus(match.status)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs sm:text-sm text-gray-600 truncate">
                        {new Date(match.date).toLocaleDateString('pt-BR')} • {match.location || 'A definir'}
                      </div>
                      {match.finalScore && (
                        <div className="mt-1 text-xs sm:text-sm font-medium text-gray-700">
                          Placar: {match.finalScore}
                        </div>
                      )}
                    </div>
                    <svg 
                      className="w-5 h-5 text-gray-400 flex-shrink-0" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav unreadNotifications={unreadNotifications} />
    </div>
  );
}
