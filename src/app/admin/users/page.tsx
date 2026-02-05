'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getAllUsers, updateUserRole, assignCredentials, deleteUser, type UserDTO } from '@/lib/api/user.api';
import { getAllAthletes } from '@/lib/api/athlete.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import type { AthleteDTO } from '@/types/athlete';

export default function UserManagementPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [athletes, setAthletes] = useState<AthleteDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for assigning credentials
  const [assignForm, setAssignForm] = useState({
    athleteId: '',
    username: '',
    email: '',
    password: '',
  });

  // Form state for updating role
  const [roleForm, setRoleForm] = useState({
    role: 'ATHLETE' as 'ATHLETE' | 'COACH' | 'ADMIN',
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
      setError(null);
      const [usersData, athletesData] = await Promise.all([
        getAllUsers(),
        getAllAthletes({ activeOnly: false }),
      ]);
      setUsers(usersData);
      setAthletes(athletesData);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      
      // If unauthorized, redirect to login
      if (err.message?.includes('Unauthorized') || err.message?.includes('401')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/login');
        return;
      }
      
      setError(err.message || 'Falha ao carregar usuários e atletas');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await assignCredentials(assignForm);
      setSuccess('Credentials assigned successfully');
      await loadData();
      setIsAssignModalOpen(false);
      resetAssignForm();
    } catch (err: any) {
      console.error('Failed to assign credentials:', err);
      setError(err.message || 'Falha ao atribuir credenciais');
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setError(null);
    setSuccess(null);

    try {
      await updateUserRole(selectedUser.id, roleForm);
      setSuccess('Função do usuário atualizada com sucesso');
      await loadData();
      setIsRoleModalOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      console.error('Failed to update role:', err);
      setError(err.message || 'Falha ao atualizar função');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza de que deseja deletar este usuário? Esta ação não pode ser desfeita.')) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await deleteUser(userId);
      setSuccess('Usuário deletado com sucesso');
      await loadData();
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      setError(err.message || 'Falha ao deletar usuário');
    }
  };

  const openRoleModal = (user: UserDTO) => {
    setSelectedUser(user);
    setRoleForm({ role: user.role });
    setIsRoleModalOpen(true);
  };

  const resetAssignForm = () => {
    setAssignForm({
      athleteId: '',
      username: '',
      email: '',
      password: '',
    });
  };

  // Get athletes without user credentials
  const athletesWithoutCredentials = athletes.filter(
    (athlete) => !users.some((user) => user.athlete?.id === athlete.id)
  );

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.athlete?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !filterRole || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">Manage user accounts, credentials, and roles</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                type="text"
                placeholder="Search by username, email, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                options={[
                  { value: '', label: 'All Roles' },
                  { value: 'ATHLETE', label: 'Athletes' },
                  { value: 'COACH', label: 'Coaches' },
                  { value: 'ADMIN', label: 'Admins' },
                ]}
              />
            </div>
            <div>
              <Button
                onClick={() => {
                  resetAssignForm();
                  setIsAssignModalOpen(true);
                }}
                className="w-full"
                disabled={athletesWithoutCredentials.length === 0}
              >
                Assign Credentials
              </Button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Athlete Profile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={
                        user.role === 'ADMIN'
                          ? 'error'
                          : user.role === 'COACH'
                          ? 'warning'
                          : 'success'
                      }
                    >
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.athlete ? (
                      <div className="text-sm text-gray-900">
                        {user.athlete.name} (#{user.athlete.jerseyNumber})
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">-</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openRoleModal(user)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Change Role
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Deletar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </div>

        {/* Assign Credentials Modal */}
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false);
            resetAssignForm();
            setError(null);
          }}
          title="Assign Credentials to Athlete"
        >
          <form onSubmit={handleAssignCredentials} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Athlete
              </label>
              <Select
                required
                value={assignForm.athleteId}
                onChange={(e) => setAssignForm({ ...assignForm, athleteId: e.target.value })}
                options={[
                  { value: '', label: 'Select an athlete' },
                  ...athletesWithoutCredentials.map((athlete) => ({
                    value: athlete.id,
                    label: `${athlete.name} (#${athlete.jerseyNumber})`,
                  })),
                ]}
              />
              {athletesWithoutCredentials.length === 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  All athletes already have credentials assigned
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <Input
                type="text"
                required
                minLength={3}
                maxLength={50}
                value={assignForm.username}
                onChange={(e) => setAssignForm({ ...assignForm, username: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                required
                value={assignForm.email}
                onChange={(e) => setAssignForm({ ...assignForm, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                type="password"
                required
                minLength={8}
                value={assignForm.password}
                onChange={(e) => setAssignForm({ ...assignForm, password: e.target.value })}
              />
              <p className="mt-1 text-sm text-gray-500">Minimum 8 characters</p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsAssignModalOpen(false);
                  resetAssignForm();
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={athletesWithoutCredentials.length === 0}>
                Assign Credentials
              </Button>
            </div>
          </form>
        </Modal>

        {/* Update Role Modal */}
        <Modal
          isOpen={isRoleModalOpen}
          onClose={() => {
            setIsRoleModalOpen(false);
            setSelectedUser(null);
            setError(null);
          }}
          title="Atualizar Função do Usuário"
        >
          <form onSubmit={handleUpdateRole} className="space-y-4">
            {selectedUser && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Username:</span> {selectedUser.username}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span> {selectedUser.email}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Current Role:</span> {selectedUser.role}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Role
              </label>
              <Select
                required
                value={roleForm.role}
                onChange={(e) =>
                  setRoleForm({ role: e.target.value as 'ATHLETE' | 'COACH' | 'ADMIN' })
                }
                options={[
                  { value: 'ATHLETE', label: 'Athlete' },
                  { value: 'COACH', label: 'Coach' },
                  { value: 'ADMIN', label: 'Admin' },
                ]}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsRoleModalOpen(false);
                  setSelectedUser(null);
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Atualizar Função</Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
