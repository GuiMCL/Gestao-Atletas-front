'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { getAllTeams, createTeam, updateTeam, getTeamAthletes } from '@/lib/api/team.api';
import type { TeamDTO, AthleteDTO } from '@/types/athlete';

export default function TeamManagementPage() {
  const [teams, setTeams] = useState<TeamDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  
  // Form states
  const [teamName, setTeamName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<TeamDTO | null>(null);
  const [rosterAthletes, setRosterAthletes] = useState<AthleteDTO[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllTeams();
      setTeams(data);
    } catch (err) {
      setError('Falha ao carregar times');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      setError('Nome do time é obrigatório');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await createTeam(teamName.trim());
      setIsCreateModalOpen(false);
      setTeamName('');
      await loadTeams();
    } catch (err) {
      setError('Falha ao criar time');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTeam = async () => {
    if (!selectedTeam || !teamName.trim()) {
      setError('Nome do time é obrigatório');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await updateTeam(selectedTeam.id, teamName.trim());
      setIsEditModalOpen(false);
      setTeamName('');
      setSelectedTeam(null);
      await loadTeams();
    } catch (err) {
      setError('Falha ao atualizar time');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (team: TeamDTO) => {
    setSelectedTeam(team);
    setTeamName(team.name);
    setIsEditModalOpen(true);
  };

  const openRosterModal = async (team: TeamDTO) => {
    setSelectedTeam(team);
    setIsRosterModalOpen(true);
    
    try {
      const athletes = await getTeamAthletes(team.id);
      setRosterAthletes(athletes);
    } catch (err) {
      console.error('Failed to load roster:', err);
      setRosterAthletes([]);
    }
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setTeamName('');
    setError(null);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setTeamName('');
    setSelectedTeam(null);
    setError(null);
  };

  const closeRosterModal = () => {
    setIsRosterModalOpen(false);
    setSelectedTeam(null);
    setRosterAthletes([]);
  };

  const teamColumns = [
    {
      key: 'name',
      header: 'Team Name',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium text-gray-900">{value}</span>
      ),
    },
    {
      key: 'athleteCount',
      header: 'Athletes',
      sortable: true,
      render: (value: number) => (
        <span className="text-gray-600">{value || 0}</span>
      ),
    },
    {
      key: 'id',
      header: 'Actions',
      render: (_: string, team: TeamDTO) => (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(team);
            }}
          >
            Edit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openRosterModal(team);
            }}
          >
            Roster
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/coach/team/analytics?teamId=${team.id}`;
            }}
          >
            Analytics
          </Button>
        </div>
      ),
    },
  ];

  const athleteColumns = [
    {
      key: 'jerseyNumber',
      header: 'Jersey #',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">#{value}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (value: string) => (
        <span className="text-gray-900">{value}</span>
      ),
    },
    {
      key: 'position',
      header: 'Position',
      sortable: true,
      render: (value: string) => (
        <span className="text-gray-600">
          {value.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando times...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
              <p className="text-gray-600 mt-2">
                Manage teams and view team rosters
              </p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Create Team
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Teams Table */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">All Teams</h2>
            {teams.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No teams found</p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Create Your First Team
                </Button>
              </div>
            ) : (
              <DataTable
                data={teams}
                columns={teamColumns}
                onRowClick={(team) => openRosterModal(team)}
              />
            )}
          </div>
        </Card>

        {/* Create Team Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={closeCreateModal}
          title="Create New Team"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Name
              </label>
              <Input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                disabled={submitting}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={closeCreateModal}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTeam}
                disabled={submitting || !teamName.trim()}
              >
                {submitting ? 'Creating...' : 'Create Team'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Team Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          title="Edit Team"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Name
              </label>
              <Input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                disabled={submitting}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={closeEditModal}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditTeam}
                disabled={submitting || !teamName.trim()}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Team Roster Modal */}
        <Modal
          isOpen={isRosterModalOpen}
          onClose={closeRosterModal}
          title={`${selectedTeam?.name || 'Team'} Roster`}
        >
          <div className="space-y-4">
            {rosterAthletes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No athletes in this team</p>
              </div>
            ) : (
              <DataTable
                data={rosterAthletes}
                columns={athleteColumns}
              />
            )}

            <div className="flex justify-end pt-4">
              <Button variant="secondary" onClick={closeRosterModal}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
