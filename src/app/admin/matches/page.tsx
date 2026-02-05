'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { getAllTeams } from '@/lib/api/team.api';
import type { TeamDTO } from '@/types/athlete';

interface Match {
  id: string;
  date: string;
  location: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  status: string;
}

export default function AdminMatchesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const [teams, setTeams] = useState<TeamDTO[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTournamentModalOpen, setIsTournamentModalOpen] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    homeTeamId: '',
    awayTeamId: '',
    date: '',
    time: '',
    location: '',
  });
  
  // Tournament form
  const [tournamentData, setTournamentData] = useState({
    name: '',
    selectedTeams: [] as string[],
    startDate: '',
    location: '',
    matchesPerDay: '2',
  });
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    if (user) {
      loadData();
    }
  }, [user, isAuthenticated, authLoading, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teamsData, matchesData] = await Promise.all([
        getAllTeams(),
        loadMatches(),
      ]);
      setTeams(teamsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Falha ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/matches`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('volleyball_access_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch matches');

      const data = await response.json();
      setMatches(data.matches || []);
      return data.matches || [];
    } catch (err) {
      console.error('Error loading matches:', err);
      return [];
    }
  };

  const handleCreateMatch = async () => {
    if (!formData.homeTeamId || !formData.awayTeamId || !formData.date || !formData.time || !formData.location) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (formData.homeTeamId === formData.awayTeamId) {
      setError('Home and away teams must be different');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const dateTime = new Date(`${formData.date}T${formData.time}`);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/matches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('volleyball_access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          homeTeamId: formData.homeTeamId,
          awayTeamId: formData.awayTeamId,
          date: dateTime.toISOString(),
          location: formData.location,
        }),
      });

      if (!response.ok) throw new Error('Failed to create match');

      setIsCreateModalOpen(false);
      resetForm();
      await loadMatches();
    } catch (err) {
      console.error('Error creating match:', err);
      setError('Falha ao criar partida');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTournament = async () => {
    if (!tournamentData.name || tournamentData.selectedTeams.length < 2 || !tournamentData.startDate || !tournamentData.location) {
      setError('Por favor, preencha todos os campos obrigatórios e selecione pelo menos 2 times');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Generate round-robin matches
      const selectedTeamsList = tournamentData.selectedTeams;
      const matchesToCreate = [];
      
      for (let i = 0; i < selectedTeamsList.length; i++) {
        for (let j = i + 1; j < selectedTeamsList.length; j++) {
          matchesToCreate.push({
            homeTeamId: selectedTeamsList[i],
            awayTeamId: selectedTeamsList[j],
          });
        }
      }

      // Create matches with dates
      const startDate = new Date(tournamentData.startDate);
      const matchesPerDay = parseInt(tournamentData.matchesPerDay);
      
      for (let i = 0; i < matchesToCreate.length; i++) {
        const dayOffset = Math.floor(i / matchesPerDay);
        const matchDate = new Date(startDate);
        matchDate.setDate(matchDate.getDate() + dayOffset);
        
        // Set time based on match number in day
        const matchOfDay = i % matchesPerDay;
        matchDate.setHours(18 + (matchOfDay * 2), 0, 0, 0);

        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/matches`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('volleyball_access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            homeTeamId: matchesToCreate[i].homeTeamId,
            awayTeamId: matchesToCreate[i].awayTeamId,
            date: matchDate.toISOString(),
            location: tournamentData.location,
          }),
        });
      }

      setIsTournamentModalOpen(false);
      resetTournamentForm();
      await loadMatches();
    } catch (err) {
      console.error('Error creating tournament:', err);
      setError('Falha ao criar partidas do torneio');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      homeTeamId: '',
      awayTeamId: '',
      date: '',
      time: '',
      location: '',
    });
    setError(null);
  };

  const resetTournamentForm = () => {
    setTournamentData({
      name: '',
      selectedTeams: [],
      startDate: '',
      location: '',
      matchesPerDay: '2',
    });
    setError(null);
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

  const formatStatus = (status: string): string => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-green-100 text-green-800';
      case 'FINALIZED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const matchColumns = [
    {
      key: 'date',
      header: 'Date & Time',
      sortable: true,
      render: (value: string) => (
        <span className="text-gray-900">{formatDate(value)}</span>
      ),
    },
    {
      key: 'homeTeam',
      header: 'Match',
      render: (_: any, match: Match) => (
        <div className="font-medium text-gray-900">
          {match.homeTeam.name} vs {match.awayTeam.name}
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      sortable: true,
      render: (value: string) => (
        <span className="text-gray-700">{value}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {formatStatus(value)}
        </span>
      ),
    },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Match Management</h1>
              <p className="text-sm text-gray-600 mt-1">Create and manage matches and tournaments</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => router.push('/admin/dashboard')}
            >
              Voltar para Painel
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-20 flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-lg font-medium">Create Single Match</span>
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => setIsTournamentModalOpen(true)}
            className="h-20 flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-lg font-medium">Create Tournament</span>
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Matches Table */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              All Matches ({matches.length})
            </h2>
            {matches.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600 text-lg">No matches created yet</p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Create First Match
                </Button>
              </div>
            ) : (
              <DataTable
                data={matches}
                columns={matchColumns}
              />
            )}
          </div>
        </Card>

        {/* Create Match Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Match"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Home Team *
              </label>
              <Select
                value={formData.homeTeamId}
                onChange={(e) => setFormData({ ...formData, homeTeamId: e.target.value })}
                options={[
                  { value: '', label: 'Select home team' },
                  ...teams.map(team => ({ value: team.id, label: team.name })),
                ]}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Away Team *
              </label>
              <Select
                value={formData.awayTeamId}
                onChange={(e) => setFormData({ ...formData, awayTeamId: e.target.value })}
                options={[
                  { value: '', label: 'Select away team' },
                  ...teams.map(team => ({ value: team.id, label: team.name })),
                ]}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time *
              </label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <Input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Match location"
                disabled={submitting}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateMatch}
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Match'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Create Tournament Modal */}
        <Modal
          isOpen={isTournamentModalOpen}
          onClose={() => setIsTournamentModalOpen(false)}
          title="Create Tournament (Round-Robin)"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tournament Name *
              </label>
              <Input
                type="text"
                value={tournamentData.name}
                onChange={(e) => setTournamentData({ ...tournamentData, name: e.target.value })}
                placeholder="Tournament name"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Teams * (minimum 2)
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                {teams.map(team => (
                  <label key={team.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={tournamentData.selectedTeams.includes(team.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTournamentData({
                            ...tournamentData,
                            selectedTeams: [...tournamentData.selectedTeams, team.id],
                          });
                        } else {
                          setTournamentData({
                            ...tournamentData,
                            selectedTeams: tournamentData.selectedTeams.filter(id => id !== team.id),
                          });
                        }
                      }}
                      disabled={submitting}
                      className="rounded"
                    />
                    <span className="text-gray-900">{team.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {tournamentData.selectedTeams.length} teams selected
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <Input
                type="date"
                value={tournamentData.startDate}
                onChange={(e) => setTournamentData({ ...tournamentData, startDate: e.target.value })}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <Input
                type="text"
                value={tournamentData.location}
                onChange={(e) => setTournamentData({ ...tournamentData, location: e.target.value })}
                placeholder="Tournament location"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Matches Per Day
              </label>
              <Select
                value={tournamentData.matchesPerDay}
                onChange={(e) => setTournamentData({ ...tournamentData, matchesPerDay: e.target.value })}
                options={[
                  { value: '1', label: '1 match per day' },
                  { value: '2', label: '2 matches per day' },
                  { value: '3', label: '3 matches per day' },
                  { value: '4', label: '4 matches per day' },
                ]}
                disabled={submitting}
              />
            </div>

            {tournamentData.selectedTeams.length >= 2 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  This will create {(tournamentData.selectedTeams.length * (tournamentData.selectedTeams.length - 1)) / 2} matches
                  (round-robin format)
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setIsTournamentModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTournament}
                disabled={submitting || tournamentData.selectedTeams.length < 2}
              >
                {submitting ? 'Creating...' : 'Create Tournament'}
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
