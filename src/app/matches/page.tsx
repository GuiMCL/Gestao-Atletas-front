'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getAthleteMatches } from '@/lib/api/athlete.api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { MobileNav } from '@/components/ui/MobileNav';
import type { MatchSummaryDTO, MatchStatus } from '@/types/athlete';

export default function MatchHistoryPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const [matches, setMatches] = useState<MatchSummaryDTO[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<MatchSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  
  // Modal state
  const [selectedMatch, setSelectedMatch] = useState<MatchSummaryDTO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'ATHLETE') {
      router.push('/');
      return;
    }

    if (user) {
      loadMatches();
    }
  }, [user, isAuthenticated, authLoading, router, currentPage]);

  useEffect(() => {
    applyFilters();
  }, [matches, searchQuery, statusFilter, dateFilter]);

  const loadMatches = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // First, get the athlete profile to get the athlete ID
      const { getMyAthleteProfile } = await import('@/lib/api/athlete.api');
      const profileData = await getMyAthleteProfile();
      
      if (!profileData || !profileData.athlete) {
        throw new Error('Athlete profile not found');
      }

      const athleteId = profileData.athlete.id;
      const data = await getAthleteMatches(athleteId, currentPage, pageSize);
      
      console.log('Matches loaded:', data);
      
      setMatches(data.matches || []);
      setFilteredMatches(data.matches || []);
      
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error loading matches:', err);
      const errorMessage = err instanceof Error ? err.message : 'Falha ao carregar histórico de partidas';
      setError(`${errorMessage}. Tente novamente.`);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...matches];

    // Search filter (by team name or location)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(match =>
        match.homeTeam?.name?.toLowerCase().includes(query) ||
        match.awayTeam?.name?.toLowerCase().includes(query) ||
        match.location?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(match => match.status === statusFilter);
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(match => {
        const matchDate = new Date(match.date).toISOString().split('T')[0];
        return matchDate === dateFilter;
      });
    }

    setFilteredMatches(filtered);
  };

  const handleMatchClick = (match: MatchSummaryDTO) => {
    setSelectedMatch(match);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMatch(null);
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

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setDateFilter('');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando jogos...</p>
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
            <Button onClick={loadMatches}>Tentar novamente</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile Optimized */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">Histórico de Jogos</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">
                Veja todos os seus jogos em ordem cronológica
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="flex-shrink-0 text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Voltar ao Painel</span>
              <span className="sm:hidden">Voltar</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20 md:pb-8">
        {/* Filters Section - Mobile Optimized */}
        <Card className="mb-4 sm:mb-6" padding="sm">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filtros</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
                className="text-xs sm:text-sm"
              >
                Limpar Tudo
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {/* Search */}
              <Input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
              />

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                fullWidth
                options={[
                  { value: 'ALL', label: 'Todos os Status' },
                  { value: 'SCHEDULED', label: 'Agendado' },
                  { value: 'IN_PROGRESS', label: 'Em Andamento' },
                  { value: 'FINALIZED', label: 'Finalizado' },
                  { value: 'CANCELLED', label: 'Cancelado' },
                ]}
              />

              {/* Date Filter */}
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                fullWidth
              />
            </div>

            <div className="text-xs sm:text-sm text-gray-600">
              Mostrando {filteredMatches.length} de {matches.length} jogos
            </div>
          </div>
        </Card>

        {/* Matches List - Mobile Optimized */}
        {filteredMatches.length === 0 ? (
          <Card>
            <div className="text-center py-8 sm:py-12">
              <svg
                className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum jogo encontrado</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                {searchQuery || statusFilter !== 'ALL' || dateFilter
                  ? 'Tente ajustar seus filtros'
                  : 'Nenhum jogo foi registrado ainda'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filteredMatches.map((match) => (
              <Card
                key={match.id}
                hoverable
                onClick={() => handleMatchClick(match)}
                className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
                padding="sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mb-2">
                      <h4 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">
                        {match.homeTeam?.name || 'Unknown'} vs {match.awayTeam?.name || 'Unknown'}
                      </h4>
                      <Badge 
                        variant={getStatusBadgeVariant(match.status)}
                        size="sm"
                        className="w-fit"
                      >
                        {formatMatchStatus(match.status)}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{formatDate(match.date)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{match.location}</span>
                      </div>
                    </div>
                    
                    {match.finalScore && (
                      <div className="mt-2 text-sm sm:text-base font-medium text-blue-600">
                        Placar Final: {match.finalScore}
                      </div>
                    )}
                  </div>
                  
                  <svg 
                    className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" 
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Próximo
            </Button>
          </div>
        )}
      </main>

      {/* Match Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Detalhes do Jogo"
        size="lg"
      >
        {selectedMatch && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {selectedMatch.homeTeam?.name || 'Unknown'} vs {selectedMatch.awayTeam?.name || 'Unknown'}
              </h3>
              <Badge variant={getStatusBadgeVariant(selectedMatch.status)}>
                {formatMatchStatus(selectedMatch.status)}
              </Badge>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Data e Hora</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedMatch.date)}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Localização</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedMatch.location}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Time da Casa</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedMatch.homeTeam?.name || 'Unknown'}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Time Visitante</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedMatch.awayTeam?.name || 'Unknown'}</dd>
                </div>
                
                {selectedMatch.finalScore && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Placar Final</dt>
                    <dd className="mt-1 text-lg font-semibold text-blue-600">
                      {selectedMatch.finalScore}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <Button
                onClick={() => {
                  handleCloseModal();
                  router.push(`/matches/${selectedMatch.id}`);
                }}
                fullWidth
              >
                Ver Detalhes Completos do Jogo
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
