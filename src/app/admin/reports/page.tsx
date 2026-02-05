'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';

import { getMatches, exportMatchStatistics } from '@/lib/api/match.api';
import type { MatchSummaryDTO } from '@/types/athlete';

type ExportFormat = 'pdf' | 'xlsx' | 'json';

interface MatchWithExport extends MatchSummaryDTO {
  exportFormat?: ExportFormat;
  isExporting?: boolean;
}

export default function ReportsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [matches, setMatches] = useState<MatchWithExport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('FINALIZED');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      loadMatches();
    }
  }, [user, statusFilter]);

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getMatches({ 
        status: statusFilter,
        pageSize: 100 
      });
      setMatches(response.matches.map(m => ({ ...m, exportFormat: 'pdf' as ExportFormat })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar partidas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportFormatChange = (matchId: string, format: ExportFormat) => {
    setMatches(prev =>
      prev.map(m => (m.id === matchId ? { ...m, exportFormat: format } : m))
    );
  };

  const handleExport = async (matchId: string, format: ExportFormat) => {
    try {
      // Set exporting state
      setMatches(prev =>
        prev.map(m => (m.id === matchId ? { ...m, isExporting: true } : m))
      );

      // Call export API
      const blob = await exportMatchStatistics(matchId, format);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Set filename based on format
      const match = matches.find(m => m.id === matchId);
      const dateStr = match?.date ? new Date(match.date).toISOString().split('T')[0] : 'unknown';
      a.download = `match-report-${dateStr}-${matchId.substring(0, 8)}.${format}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export report');
    } finally {
      // Clear exporting state
      setMatches(prev =>
        prev.map(m => (m.id === matchId ? { ...m, isExporting: false } : m))
      );
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'FINALIZED':
        return 'success';
      case 'IN_PROGRESS':
        return 'warning';
      case 'SCHEDULED':
        return 'info';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'location',
      header: 'Location',
      sortable: true,
    },
    {
      key: 'awayTeam',
      header: 'Opponent',
      sortable: true,
      render: (_value: any, row: MatchWithExport) => row.awayTeam.name,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value: string) => (
        <Badge variant={getStatusBadgeVariant(value)}>
          {value}
        </Badge>
      ),
    },
    {
      key: 'exportFormat',
      header: 'Export Format',
      render: (_value: any, row: MatchWithExport) => (
        <select
          value={row.exportFormat || 'pdf'}
          onChange={(e) => handleExportFormatChange(row.id, e.target.value as ExportFormat)}
          disabled={row.isExporting}
          className="block px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="pdf">PDF</option>
          <option value="xlsx">XLSX</option>
          <option value="json">JSON</option>
        </select>
      ),
    },
    {
      key: 'id',
      header: 'Actions',
      render: (_value: any, row: MatchWithExport) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleExport(row.id, row.exportFormat || 'pdf');
            }}
            disabled={row.isExporting || row.status !== 'FINALIZED'}
          >
            {row.isExporting ? 'Exporting...' : 'Export'}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/matches/${row.id}`);
            }}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  if (authLoading || (user && user.role !== 'ADMIN')) {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Exports</h1>
              <p className="mt-2 text-gray-600">
                Export match reports in PDF, XLSX, or JSON format
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => router.push('/admin/dashboard')}
            >
              Voltar para Painel
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                Filter by Status:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-48 block px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">All Matches</option>
                <option value="FINALIZED">Finalized</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="SCHEDULED">Scheduled</option>
              </select>
              <Button
                size="sm"
                variant="secondary"
                onClick={loadMatches}
              >
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Export Information
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <strong>PDF:</strong> Formatted report with all match statistics, team data, and athlete performance
                    </li>
                    <li>
                      <strong>XLSX:</strong> Spreadsheet with separate sheets for metadata, team stats, sets, and athletes
                    </li>
                    <li>
                      <strong>JSON:</strong> Complete data export for API integration and custom processing
                    </li>
                    <li>Only finalized matches can be exported</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Matches Table */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Available Reports
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Carregando partidas...</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No matches found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {statusFilter
                    ? `No ${statusFilter.toLowerCase()} matches available.`
                    : 'No matches available for export.'}
                </p>
              </div>
            ) : (
              <DataTable
                data={matches}
                columns={columns}
                pagination={true}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
