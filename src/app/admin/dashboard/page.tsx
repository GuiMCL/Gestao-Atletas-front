'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [user, isLoading, router]);

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.username}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Athlete Management
              </h3>
              <p className="text-gray-600 mb-4">
                Create, edit, and manage athlete profiles and credentials
              </p>
              <Button
                onClick={() => router.push('/admin/athletes')}
                className="w-full"
              >
                Manage Athletes
              </Button>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Team Management
              </h3>
              <p className="text-gray-600 mb-4">
                Create and manage teams and rosters
              </p>
              <Button
                onClick={() => router.push('/admin/teams')}
                className="w-full"
              >
                Manage Teams
              </Button>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                User Management
              </h3>
              <p className="text-gray-600 mb-4">
                Manage user accounts and permissions
              </p>
              <Button
                onClick={() => router.push('/admin/users')}
                className="w-full"
              >
                Manage Users
              </Button>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Match Management
              </h3>
              <p className="text-gray-600 mb-4">
                Create matches and tournaments
              </p>
              <Button
                onClick={() => router.push('/admin/matches')}
                className="w-full"
              >
                Manage Matches
              </Button>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Reports & Exports
              </h3>
              <p className="text-gray-600 mb-4">
                View and export match reports and statistics
              </p>
              <Button
                onClick={() => router.push('/admin/reports')}
                className="w-full"
              >
                View Reports
              </Button>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Coach Dashboard
              </h3>
              <p className="text-gray-600 mb-4">
                Access coach features for match management
              </p>
              <Button
                onClick={() => router.push('/coach/dashboard')}
                className="w-full"
              >
                Ir para Painel do Treinador
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
