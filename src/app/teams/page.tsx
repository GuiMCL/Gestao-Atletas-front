'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { getAllTeams } from '@/lib/api/team.api';
import type { TeamDTO } from '@/types/athlete';

export default function TeamsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [teams, setTeams] = useState<TeamDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadTeams();
    }
  }, [authLoading, isAuthenticated]);

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

  const teamColumns = [
    {
      key: 'name',
      header: 'Team Name',
      sortable: true,
      render: (value: string) => (
        <span className="font-semibold text-gray-900 text-lg">{value}</span>
      ),
    },
    {
      key: 'athleteCount',
      header: 'Athletes',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-gray-700 font-medium">{value || 0} athletes</span>
        </div>
      ),
    },
    {
      key: 'id',
      header: 'Actions',
      render: (_: string, team: TeamDTO) => (
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/coach/team/analytics?teamId=${team.id}`;
            }}
          >
            View Analytics
          </Button>
        </div>
      ),
    },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando times...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <div className="text-center p-6">
            <p className="text-gray-600 mb-4">Por favor, faça login para visualizar times</p>
            <Button onClick={() => window.location.href = '/login'}>
              Ir para Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
              <p className="text-gray-600 mt-2">
                View all teams and their performance analytics
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard'}
            >
              Voltar para Painel
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
            <Button 
              variant="secondary" 
              size="sm" 
              className="mt-2"
              onClick={loadTeams}
            >
              Tentar Novamente
            </Button>
          </div>
        )}

        {/* Teams Grid */}
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                All Teams ({teams.length})
              </h2>
            </div>
            
            {teams.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-600 text-lg">No teams found</p>
                <p className="text-gray-500 text-sm mt-2">
                  Contact an administrator to create teams
                </p>
              </div>
            ) : (
              <DataTable
                data={teams}
                columns={teamColumns}
                onRowClick={(team) => {
                  window.location.href = `/coach/team/analytics?teamId=${team.id}`;
                }}
              />
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
