'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { getAllTeams, getTeam } from '@/lib/api/team.api';
import { getAccessToken } from '@/lib/auth';
import type { TeamDTO, AthleteDTO } from '@/types/athlete';

export default function CoachAthletesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const [teams, setTeams] = useState<TeamDTO[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [athletes, setAthletes] = useState<AthleteDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteDTO | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    jerseyNumber: '',
    position: '',
    bio: '',
  });
  const [submitting, setSubmitting] = useState(false);

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
      loadTeams();
    }
  }, [user, isAuthenticated, authLoading, router]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const teamsData = await getAllTeams();
      setTeams(teamsData);
      
      // Se for coach, filtrar apenas seu time
      let teamToLoad = teamsData[0];
      if (user?.role === 'COACH' && user?.teamId) {
        const coachTeam = teamsData.find(t => t.id === user.teamId);
        if (coachTeam) {
          teamToLoad = coachTeam;
        }
      }
      
      if (teamToLoad) {
        setSelectedTeam(teamToLoad.id);
        await loadAthletes(teamToLoad.id);
      }
    } catch (err) {
      console.error('Error loading teams:', err);
      setError('Falha ao carregar times');
    } finally {
      setLoading(false);
    }
  };

  const loadAthletes = async (teamId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/teams/${teamId}/athletes`, {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error('Falha ao buscar atletas');

      const data = await response.json();
      setAthletes(data.athletes || []);
    } catch (err) {
      console.error('Error loading athletes:', err);
      setError('Falha ao carregar atletas');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamChange = (teamId: string) => {
    // Se for coach, não permitir mudar de time
    if (user?.role === 'COACH' && user?.teamId && teamId !== user.teamId) {
      setError('Você só pode gerenciar atletas do seu próprio time');
      return;
    }
    
    setSelectedTeam(teamId);
    loadAthletes(teamId);
  };

  const handleCreateAthlete = async () => {
    if (!formData.name || !formData.jerseyNumber || !formData.position) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/athletes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          jerseyNumber: parseInt(formData.jerseyNumber),
          position: formData.position,
          teamId: selectedTeam,
          bio: formData.bio || undefined,
        }),
      });

      if (!response.ok) throw new Error('Falha ao criar atleta');

      setIsCreateModalOpen(false);
      resetForm();
      await loadAthletes(selectedTeam);
    } catch (err) {
      console.error('Error creating athlete:', err);
      setError('Falha ao criar atleta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAthlete = async () => {
    if (!selectedAthlete || !formData.name || !formData.jerseyNumber || !formData.position) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/athletes/${selectedAthlete.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          jerseyNumber: parseInt(formData.jerseyNumber),
          position: formData.position,
          bio: formData.bio || undefined,
        }),
      });

      if (!response.ok) throw new Error('Falha ao atualizar atleta');

      setIsEditModalOpen(false);
      setSelectedAthlete(null);
      resetForm();
      await loadAthletes(selectedTeam);
    } catch (err) {
      console.error('Error updating athlete:', err);
      setError('Falha ao atualizar atleta');
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (athlete: AthleteDTO) => {
    setSelectedAthlete(athlete);
    setFormData({
      name: athlete.name,
      jerseyNumber: athlete.jerseyNumber.toString(),
      position: athlete.position,
      bio: athlete.bio || '',
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      jerseyNumber: '',
      position: '',
      bio: '',
    });
    setError(null);
  };

  const athleteColumns = [
    {
      key: 'jerseyNumber',
      header: 'Número',
      sortable: true,
      render: (value: number) => (
        <span className="font-bold text-lg text-blue-600">#{value}</span>
      ),
    },
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium text-gray-900">{value}</span>
      ),
    },
    {
      key: 'position',
      header: 'Posição',
      sortable: true,
      render: (value: string) => {
        const positionMap: Record<string, string> = {
          'SETTER': 'Levantador',
          'OUTSIDE_HITTER': 'Ponta',
          'OPPOSITE': 'Oposto',
          'MIDDLE_BLOCKER': 'Central',
          'LIBERO': 'Líbero'
        };
        return (
          <span className="text-gray-700">
            {positionMap[value] || value.replace(/_/g, ' ')}
          </span>
        );
      },
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            value
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'Ações',
      render: (_: string, athlete: AthleteDTO) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(athlete);
            }}
          >
            Editar
          </Button>
        </div>
      ),
    },
  ];

  const positionOptions = [
    { value: '', label: 'Selecionar Posição' },
    { value: 'SETTER', label: 'Levantador' },
    { value: 'OUTSIDE_HITTER', label: 'Ponta' },
    { value: 'OPPOSITE', label: 'Oposto' },
    { value: 'MIDDLE_BLOCKER', label: 'Central' },
    { value: 'LIBERO', label: 'Líbero' },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se for coach, mostrar apenas seu time
  const displayTeams = user?.role === 'COACH' && user?.teamId 
    ? teams.filter(t => t.id === user.teamId)
    : teams;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Atletas</h1>
              <p className="text-sm text-gray-600 mt-1">Gerencie os atletas do seu time</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => router.push('/coach/dashboard')}
            >
              Voltar para Painel
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Team Selector */}
        <div className="mb-6">
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecionar Time
                </label>
                <Select
                  value={selectedTeam}
                  onChange={(e) => handleTeamChange(e.target.value)}
                  options={[
                    { value: '', label: 'Selecionar uma equipe' },
                    ...displayTeams.map(team => ({
                      value: team.id,
                      label: `${team.name} (${team.athleteCount} atletas)`,
                    })),
                  ]}
                  disabled={user?.role === 'COACH'}
                />
              </div>
              <div className="pt-6">
                <Button
                  onClick={openCreateModal}
                  disabled={!selectedTeam}
                >
                  Adicionar Atleta
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Athletes Table */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Atletas ({athletes.length})
            </h2>
            {athletes.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-600 text-lg">Nenhum atleta neste time</p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={openCreateModal}
                  disabled={!selectedTeam}
                >
                  Adicionar Primeiro Atleta
                </Button>
              </div>
            ) : (
              <DataTable
                data={athletes}
                columns={athleteColumns}
              />
            )}
          </div>
        </Card>

        {/* Create Athlete Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Adicionar Novo Atleta"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do atleta"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número da Camisa *
              </label>
              <Input
                type="number"
                value={formData.jerseyNumber}
                onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                placeholder="1-99"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posição *
              </label>
              <Select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                options={positionOptions}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biografia
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Biografia do atleta"
                disabled={submitting}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateAthlete}
                disabled={submitting || !formData.name || !formData.jerseyNumber || !formData.position}
              >
                {submitting ? 'Criando...' : 'Criar Atleta'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Athlete Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Editar Atleta"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do atleta"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número da Camisa *
              </label>
              <Input
                type="number"
                value={formData.jerseyNumber}
                onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                placeholder="1-99"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posição *
              </label>
              <Select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                options={positionOptions}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biografia
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Biografia do atleta"
                disabled={submitting}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setIsEditModalOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEditAthlete}
                disabled={submitting || !formData.name || !formData.jerseyNumber || !formData.position}
              >
                {submitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
