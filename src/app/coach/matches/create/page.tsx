'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createMatch } from '@/lib/api/match.api';
import { getTeamAthletes, getAllTeams } from '@/lib/api/team.api';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { AthleteDTO, TeamDTO } from '@/types/athlete';

interface FormData {
  date: string;
  location: string;
  myTeamId: string;
  opponentTeamName: string;
  athleteIds: string[];
}

interface FormErrors {
  date?: string;
  location?: string;
  myTeamId?: string;
  opponentTeamName?: string;
  athleteIds?: string;
}

export default function CreateMatchPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const [teams, setTeams] = useState<TeamDTO[]>([]);
  const [athletes, setAthletes] = useState<AthleteDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    date: '',
    location: '',
    myTeamId: '',
    opponentTeamName: '',
    athleteIds: [],
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});

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
      loadCoachTeam();
    }
  }, [user, isAuthenticated, authLoading, router]);

  const loadCoachTeam = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user has a teamId
      if (!user?.teamId) {
        setError('Você não está atribuído a nenhum time. Por favor, entre em contato com um administrador.');
        setLoading(false);
        return;
      }

      // Get all teams to display the coach's team name
      const teamsData = await getAllTeams();
      setTeams(teamsData);

      // Use the coach's teamId from their profile
      const coachTeamId = user.teamId;
      setFormData(prev => ({ ...prev, myTeamId: coachTeamId }));
      await loadAthletes(coachTeamId);
    } catch (err) {
      console.error('Error loading coach team:', err);
      setError('Falha ao carregar seu time. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadAthletes = async (teamId: string) => {
    try {
      setError(null);

      const athletesData = await getTeamAthletes(teamId);
      // Filter only active athletes
      const activeAthletes = athletesData.filter(a => a.isActive);
      setAthletes(activeAthletes);
    } catch (err) {
      console.error('Error loading athletes:', err);
      setError('Failed to load team roster. Please try again.');
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.date) {
      errors.date = 'Match date and time is required';
    }

    if (!formData.location || formData.location.trim().length === 0) {
      errors.location = 'Location is required';
    }

    if (!formData.myTeamId) {
      errors.myTeamId = 'Your team is required';
    }

    if (!formData.opponentTeamName || formData.opponentTeamName.trim().length === 0) {
      errors.opponentTeamName = 'Opponent team name is required';
    }

    if (formData.athleteIds.length === 0) {
      errors.athleteIds = 'At least one athlete must be selected';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Convert datetime-local format to ISO 8601
      const dateISO = new Date(formData.date).toISOString();

      const result = await createMatch({
        date: dateISO,
        location: formData.location.trim(),
        myTeamId: formData.myTeamId,
        opponentTeamName: formData.opponentTeamName.trim(),
        athleteIds: formData.athleteIds,
      });

      // Navigate to the match details page
      router.push(`/coach/matches/${result.matchId}`);
    } catch (err) {
      console.error('Error creating match:', err);
      setError(err instanceof Error ? err.message : 'Falha ao criar partida. Tente novamente.');
      setSubmitting(false);
    }
  };

  const handleAthleteToggle = (athleteId: string) => {
    setFormData(prev => ({
      ...prev,
      athleteIds: prev.athleteIds.includes(athleteId)
        ? prev.athleteIds.filter(id => id !== athleteId)
        : [...prev.athleteIds, athleteId],
    }));
    
    // Clear athlete selection error when user makes a selection
    if (formErrors.athleteIds) {
      setFormErrors(prev => ({ ...prev, athleteIds: undefined }));
    }
  };

  const handleSelectAll = () => {
    if (formData.athleteIds.length === athletes.length) {
      // Deselect all
      setFormData(prev => ({ ...prev, athleteIds: [] }));
    } else {
      // Select all
      setFormData(prev => ({ ...prev, athleteIds: athletes.map(a => a.id) }));
    }
  };

  const getPositionLabel = (position: string): string => {
    const labels: Record<string, string> = {
      SETTER: 'Levantador',
      OUTSIDE_HITTER: 'Ponta',
      OPPOSITE: 'Oposto',
      MIDDLE_BLOCKER: 'Central',
      LIBERO: 'Líbero',
    };
    return labels[position] || position;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Criar Nova Partida</h1>
              <p className="text-sm text-gray-600 mt-1">Agende uma nova partida e selecione sua escalação</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <form onSubmit={handleSubmit}>
          {/* Match Details */}
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalhes da Partida</h2>
            
            <div className="space-y-4">
              <DatePicker
                label="Data e Hora da Partida"
                showTime
                fullWidth
                value={formData.date}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, date: e.target.value }));
                  if (formErrors.date) {
                    setFormErrors(prev => ({ ...prev, date: undefined }));
                  }
                }}
                error={formErrors.date}
                required
              />

              <Input
                label="Local"
                type="text"
                fullWidth
                placeholder="ex: Ginásio Principal, Quadra 1"
                value={formData.location}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, location: e.target.value }));
                  if (formErrors.location) {
                    setFormErrors(prev => ({ ...prev, location: undefined }));
                  }
                }}
                error={formErrors.location}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seu Time
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {teams.find(t => t.id === formData.myTeamId)?.name || 'Carregando...'}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Este é seu time atribuído
                </p>
              </div>

              <Input
                label="Nome do Time Adversário"
                type="text"
                fullWidth
                placeholder="ex: Clube de Voleibol da Cidade"
                value={formData.opponentTeamName}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, opponentTeamName: e.target.value }));
                  if (formErrors.opponentTeamName) {
                    setFormErrors(prev => ({ ...prev, opponentTeamName: undefined }));
                  }
                }}
                error={formErrors.opponentTeamName}
                required
              />
            </div>
          </Card>

          {/* Athlete Selection */}
          <Card className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Selecionar Atletas</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {formData.athleteIds.length} de {athletes.length} atletas selecionados
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {formData.athleteIds.length === athletes.length ? 'Desselecionar Todos' : 'Selecionar Todos'}
              </Button>
            </div>

            {formErrors.athleteIds && (
              <div className="mb-4 text-sm text-red-600">
                {formErrors.athleteIds}
              </div>
            )}

            {!formData.myTeamId ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p>Por favor, selecione seu time para ver os atletas disponíveis.</p>
              </div>
            ) : athletes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p>Nenhum atleta ativo encontrado em seu time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {athletes.map((athlete) => (
                  <label
                    key={athlete.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.athleteIds.includes(athlete.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.athleteIds.includes(athlete.id)}
                      onChange={() => handleAthleteToggle(athlete.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          #{athlete.jerseyNumber} {athlete.name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {getPositionLabel(athlete.position)}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={submitting || !formData.myTeamId}
            >
              Create Match
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
