'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getAllAthletes, createAthlete, updateAthleteProfile, deactivateAthlete } from '@/lib/api/athlete.api';
import { getAllTeams } from '@/lib/api/team.api';
import { registerUser } from '@/lib/api/auth.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import type { AthleteDTO, TeamDTO, Position } from '@/types/athlete';

export default function AthleteManagementPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [athletes, setAthletes] = useState<AthleteDTO[]>([]);
  const [teams, setTeams] = useState<TeamDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeam, setFilterTeam] = useState<string>('');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    position: 'OUTSIDE_HITTER' as Position,
    jerseyNumber: 1,
    teamId: '',
    bio: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
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
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [athletesData, teamsData] = await Promise.all([
        getAllAthletes({ activeOnly: false }),
        getAllTeams(),
      ]);
      setAthletes(athletesData);
      setTeams(teamsData);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load athletes and teams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // First, create the user account
      const newUser = await registerUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: 'ATHLETE',
      });

      // Then create the athlete profile
      await createAthlete({
        userId: newUser.id,
        name: formData.name,
        position: formData.position,
        jerseyNumber: formData.jerseyNumber,
        teamId: formData.teamId,
        bio: formData.bio,
      });

      // Reload athletes
      await loadData();
      setIsCreateModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('Failed to create athlete:', err);
      setError(err.message || 'Failed to create athlete');
    }
  };

  const handleEditAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthlete) return;

    setError(null);

    try {
      await updateAthleteProfile(selectedAthlete.id, {
        name: formData.name,
        position: formData.position,
        jerseyNumber: formData.jerseyNumber,
        bio: formData.bio,
      });

      // Reload athletes
      await loadData();
      setIsEditModalOpen(false);
      setSelectedAthlete(null);
      resetForm();
    } catch (err: any) {
      console.error('Failed to update athlete:', err);
      setError(err.message || 'Failed to update athlete');
    }
  };

  const handleDeactivateAthlete = async (athleteId: string) => {
    if (!confirm('Are you sure you want to deactivate this athlete?')) {
      return;
    }

    try {
      await deactivateAthlete(athleteId);
      await loadData();
    } catch (err) {
      console.error('Failed to deactivate athlete:', err);
      setError('Failed to deactivate athlete');
    }
  };

  const openEditModal = (athlete: AthleteDTO) => {
    setSelectedAthlete(athlete);
    setFormData({
      name: athlete.name,
      email: '',
      username: '',
      password: '',
      position: athlete.position,
      jerseyNumber: athlete.jerseyNumber,
      teamId: athlete.teamId,
      bio: athlete.bio || '',
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      username: '',
      password: '',
      position: 'OUTSIDE_HITTER',
      jerseyNumber: 1,
      teamId: '',
      bio: '',
    });
  };

  const filteredAthletes = athletes.filter((athlete) => {
    const matchesSearch =
      athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athlete.jerseyNumber.toString().includes(searchQuery);
    const matchesTeam = !filterTeam || athlete.teamId === filterTeam;
    const matchesActive =
      filterActive === 'all' ||
      (filterActive === 'active' && athlete.isActive) ||
      (filterActive === 'inactive' && !athlete.isActive);

    return matchesSearch && matchesTeam && matchesActive;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Athlete Management</h1>
          <p className="mt-2 text-gray-600">Manage athlete profiles and credentials</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                type="text"
                placeholder="Search by name or number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                options={[
                  { value: '', label: 'All Teams' },
                  ...teams.map((team) => ({ value: team.id, label: team.name })),
                ]}
              />
            </div>
            <div>
              <Select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active Only' },
                  { value: 'inactive', label: 'Inactive Only' },
                ]}
              />
            </div>
            <div>
              <Button
                onClick={() => {
                  resetForm();
                  setIsCreateModalOpen(true);
                }}
                className="w-full"
              >
                Create Athlete
              </Button>
            </div>
          </div>
        </div>

        {/* Athletes Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jersey #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAthletes.map((athlete) => (
                <tr key={athlete.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{athlete.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{athlete.jerseyNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {athlete.position.replace(/_/g, ' ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {teams.find((t) => t.id === athlete.teamId)?.name || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={athlete.isActive ? 'success' : 'default'}>
                      {athlete.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(athlete)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    {athlete.isActive && (
                      <button
                        onClick={() => handleDeactivateAthlete(athlete.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAthletes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No athletes found</p>
            </div>
          )}
        </div>

        {/* Create Athlete Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            resetForm();
            setError(null);
          }}
          title="Create New Athlete"
        >
          <form onSubmit={handleCreateAthlete} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <Input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team
              </label>
              <Select
                required
                value={formData.teamId}
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                options={[
                  { value: '', label: 'Select a team' },
                  ...teams.map((team) => ({ value: team.id, label: team.name })),
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <Select
                required
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value as Position })}
                options={[
                  { value: 'SETTER', label: 'Setter' },
                  { value: 'OUTSIDE_HITTER', label: 'Outside Hitter' },
                  { value: 'OPPOSITE', label: 'Opposite' },
                  { value: 'MIDDLE_BLOCKER', label: 'Middle Blocker' },
                  { value: 'LIBERO', label: 'Libero' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jersey Number
              </label>
              <Input
                type="number"
                required
                min="0"
                max="99"
                value={formData.jerseyNumber}
                onChange={(e) =>
                  setFormData({ ...formData, jerseyNumber: parseInt(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio (Optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Create Athlete</Button>
            </div>
          </form>
        </Modal>

        {/* Edit Athlete Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedAthlete(null);
            resetForm();
            setError(null);
          }}
          title="Edit Athlete"
        >
          <form onSubmit={handleEditAthlete} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <Select
                required
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value as Position })}
                options={[
                  { value: 'SETTER', label: 'Setter' },
                  { value: 'OUTSIDE_HITTER', label: 'Outside Hitter' },
                  { value: 'OPPOSITE', label: 'Opposite' },
                  { value: 'MIDDLE_BLOCKER', label: 'Middle Blocker' },
                  { value: 'LIBERO', label: 'Libero' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jersey Number
              </label>
              <Input
                type="number"
                required
                min="0"
                max="99"
                value={formData.jerseyNumber}
                onChange={(e) =>
                  setFormData({ ...formData, jerseyNumber: parseInt(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio (Optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedAthlete(null);
                  resetForm();
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
