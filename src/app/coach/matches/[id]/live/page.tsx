'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { 
  getMatch, 
  registerAction, 
  getLiveStatistics, 
  createSet, 
  finalizeSet, 
  getMatchSets, 
  undoLastAction,
  startMatch,
  endMatch,
  exportMatchStatistics
} from '@/lib/api/match.api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

import type { 
  MatchDTO, 
  AthleteDTO, 
  SetDTO, 
  ActionType, 
  ActionResult,
  LiveStatisticsDTO,
  
} from '@/types/athlete';
// Tipos e constantes
interface ActionButton {
  type: ActionType;
  label: string;
  icon: string;
  color: string;
  results: { value: ActionResult; label: string }[];
}
interface ActionLog {
  id: string;
  type: ActionType;
  result: ActionResult;
  player: AthleteDTO;
  timestamp: Date;
  setNumber: number;
}
const ACTION_BUTTONS: ActionButton[] = [
  {
    type: 'SERVE',
    label: 'Saque',
    icon: '🏐',
    color: 'bg-cyan-500 hover:bg-cyan-600',
    results: [
      { value: 'ACE', label: 'Ace' },
      { value: 'SERVE_IN', label: 'Em jogo' },
      { value: 'SERVE_ERROR', label: 'Erro' },
    ],
  },
  {
    type: 'ATTACK',
    label: 'Ataque',
    icon: '⚡',
    color: 'bg-orange-500 hover:bg-orange-600',
    results: [
      { value: 'ATTACK_POINT', label: 'Ponto' },
      { value: 'ATTACK_BLOCKED', label: 'Bloqueado' },
      { value: 'ATTACK_ERROR', label: 'Erro' },
    ],
  },
  {
    type: 'BLOCK',
    label: 'Bloqueio',
    icon: '🛡️',
    color: 'bg-indigo-500 hover:bg-indigo-600',
    results: [
      { value: 'BLOCK_POINT', label: 'Ponto' },
      { value: 'BLOCK_TOUCH', label: 'Toque' },
      { value: 'BLOCK_MISS', label: 'Falha' },
    ],
  },
  {
    type: 'RECEPTION',
    label: 'Recepção',
    icon: '📥',
    color: 'bg-emerald-500 hover:bg-emerald-600',
    results: [
      { value: 'RECEPTION_A', label: 'Excelente (A)' },
      { value: 'RECEPTION_B', label: 'Boa (B)' },
      { value: 'RECEPTION_C', label: 'Regular (C)' },
      { value: 'RECEPTION_D', label: 'Falha (D)' },
    ],
  },
  {
    type: 'DEFENSE',
    label: 'Defesa',
    icon: '🔰',
    color: 'bg-rose-500 hover:bg-rose-600',
    results: [
      { value: 'DEFENSE_SUCCESS', label: 'Sucesso' },
      { value: 'DEFENSE_FAIL', label: 'Falha' },
    ],
  },
];
export default function LiveMatchPage() {
  const router = useRouter();
  const { id: matchId } = useParams();
  const { user } = useAuth();
  const [match, setMatch] = useState<MatchDTO | null>(null);
  const [currentSet, setCurrentSet] = useState<SetDTO | null>(null);
  const [allSets, setAllSets] = useState<SetDTO[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<AthleteDTO | null>(null);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);
  const [showEndSetModal, setShowEndSetModal] = useState(false);
  const [showEndMatchModal, setShowEndMatchModal] = useState(false);
  const [showNewSetModal, setShowNewSetModal] = useState(false);
  const [stats, setStats] = useState<LiveStatisticsDTO | null>(null);

  // Update score immediately without waiting for WebSocket
  const updateScoreImmediately = (actionType: ActionType, result: ActionResult, athleteId: string) => {
    if (!match || !currentSet) return;
    
    // Define which actions result in points and for which team
    const scoringActions: Record<string, Record<string, 'home' | 'away' | null>> = {
      SERVE: {
        ACE: 'home', // Home team scores (athlete's team)
        SERVE_ERROR: 'away', // Away team scores (opponent)
        SERVE_IN: null, // No point scored
      },
      ATTACK: {
        ATTACK_POINT: 'home', // Home team scores (athlete's team)
        ATTACK_ERROR: 'away', // Away team scores (opponent)
        ATTACK_BLOCKED: 'away', // Away team scores (opponent)
      },
      BLOCK: {
        BLOCK_POINT: 'home', // Home team scores (athlete's team)
        BLOCK_TOUCH: null, // No point scored
        BLOCK_MISS: 'away', // Away team scores (opponent)
      },
      RECEPTION: {
        RECEPTION_A: null, // No point scored
        RECEPTION_B: null, // No point scored
        RECEPTION_C: null, // No point scored
        RECEPTION_D: 'away', // Away team scores (opponent)
      },
      DEFENSE: {
        DEFENSE_SUCCESS: null, // No point scored
        DEFENSE_FAIL: 'away', // Away team scores (opponent)
      },
      SET: {
        SET_SUCCESS: null, // No point scored
        SET_ERROR: 'away', // Away team scores (opponent)
      },
    };

    // Check if this action results in a point
    const actionScoring = scoringActions[actionType];
    if (!actionScoring) {
      return; // Action type not defined for scoring
    }

    const scoringTeam = actionScoring[result];
    if (scoringTeam === null) {
      return; // No point scored for this result
    }

    // Determine which team scored the point
    const isHomeTeamAthlete = selectedPlayer?.teamId === match?.homeTeam?.id;
    let newHomeScore = currentSet.homeScore;
    let newAwayScore = currentSet.awayScore;

    if (scoringTeam === 'home') {
      // Home team scores (athlete's team)
      if (isHomeTeamAthlete) {
        newHomeScore += 1;
      } else {
        newAwayScore += 1;
      }
    } else if (scoringTeam === 'away') {
      // Away team scores (opponent)
      if (isHomeTeamAthlete) {
        newAwayScore += 1;
      } else {
        newHomeScore += 1;
      }
    }

    // Update current set with new scores
    setCurrentSet(prev => prev ? {
      ...prev,
      homeScore: newHomeScore,
      awayScore: newAwayScore
    } : null);
  };

  // Carregar dados iniciais
  useEffect(() => {
    const loadMatchData = async () => {
      try {
        setIsLoading(true);
        const [matchData, setsData] = await Promise.all([
          getMatch(matchId as string),
          getMatchSets(matchId as string)
        ]);
        
        setMatch(matchData);
        setAllSets(setsData);
        
        const activeSet = setsData.find(set => set.status === 'IN_PROGRESS') || 
                         setsData[setsData.length - 1];
        setCurrentSet(activeSet);
        
        // Load statistics whenever match data is available, not just when there's an active set
        if (matchId) {
          loadStats(matchId as string);
        }
      } catch (error) {
        console.error('Erro ao carregar partida:', error);
        toast.error('Falha ao carregar os dados da partida');
      } finally {
        setIsLoading(false);
      }
    };
    loadMatchData();
  }, [matchId]);
  // Carregar estatísticas
  const loadStats = useCallback(async (matchId: string) => {
    if (!matchId) return;
    
    try {
      console.log('Carregando estatísticas para a partida:', matchId);
      const statsData = await getLiveStatistics(matchId);
      console.log('Estatísticas recebidas:', statsData);
      
      // Only update stats if data is valid and not empty
      if (statsData && statsData.matchStatistics) {
        setStats(statsData);
      } else {
        console.warn('Estatísticas vazias ou inválidas recebidas:', statsData);
        // Don't clear existing stats if new data is invalid
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      console.error('Detalhes do erro:', {
        matchId,
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      // Don't show toast error on initial load to avoid disturbing user
      // toast.error('Falha ao carregar estatísticas em tempo real');
    }
  }, []);

  // Configurar WebSocket
  const { error: wsError } = useWebSocket(
    matchId as string,
    {
      onActionRegistered: (data) => {
        console.log('=== ACTION REGISTERED EVENT DEBUG ===');
        console.log('Full event data:', JSON.stringify(data, null, 2));
        console.log('Action data:', data.action);
        console.log('Updated statistics:', data.updatedStatistics);
        console.log('Has updatedStatistics:', !!data.updatedStatistics);
        
        if (data.updatedStatistics) {
          console.log('Statistics structure:', {
            hasCurrentSet: !!data.updatedStatistics.currentSet,
            hasCurrentSetStatistics: !!data.updatedStatistics.currentSetStatistics,
            hasMatchStatistics: !!data.updatedStatistics.matchStatistics,
            teamStats: data.updatedStatistics.matchStatistics?.teamStatistics
          });
        }
        
        // Use updated statistics from WebSocket event if available
        if (data.updatedStatistics) {
          console.log('Using updated statistics from WebSocket event:', data.updatedStatistics);
          setStats(data.updatedStatistics);
        } else {
          // Fallback to loading stats from server
          console.log('No updated statistics in event, loading from server');
          loadStats(matchId as string);
        }
        
        // After updating stats, ensure the UI reflects the changes
        if (data.updatedStatistics) {
          console.log('Stats updated from WebSocket, forcing UI update');
        }
        
        console.log('Adding to action logs...');
        console.log('Current selectedPlayer:', selectedPlayer);
        console.log('Action data:', data.action);
        
        setActionLogs(prev => {
          console.log('Previous action logs:', prev);
          
          const newLog = {
            id: data.action?.id || Date.now().toString(),
            type: data.action?.actionType || 'UNKNOWN',
            result: data.action?.result || 'UNKNOWN',
            player: data.action?.athleteName ? { 
              id: data.action?.athleteId || '', 
              name: data.action.athleteName,
              jerseyNumber: data.action?.athleteJerseyNumber || 0,
              position: 'OUTSIDE_HITTER' as any,
              userId: '',
              teamId: '',
              isActive: true
            } : selectedPlayer || { 
              id: '', 
              name: 'Unknown',
              jerseyNumber: 0,
              position: 'OUTSIDE_HITTER' as any,
              userId: '',
              teamId: '',
              isActive: true
            },
            timestamp: new Date(data.timestamp),
            setNumber: currentSet?.setNumber || 1
          };
          
          console.log('New action log created:', newLog);
          const updatedLogs = [newLog, ...prev];
          console.log('Updated action logs length:', updatedLogs.length);
          console.log('Updated action logs:', updatedLogs);
          return updatedLogs;
        });
        console.log('=== END ACTION REGISTERED EVENT DEBUG ===');
      },
      onSetFinalized: (data) => {
        toast.success('Set finalizado');
        // Recarregar dados do set
        if (matchId) {
          getMatchSets(matchId as string).then(sets => {
            setAllSets(sets);
            const updatedCurrentSet = sets.find(set => set.id === currentSet?.id);
            if (updatedCurrentSet) {
              setCurrentSet(updatedCurrentSet);
            }
          });
        }
      },
      onMatchFinalized: (data) => {
        toast.success('Partida finalizada');
        router.push(`/coach/matches/${matchId}/finalize`);
      },
      onLiveStatisticsUpdate: (data) => {
        if (data.liveStatistics && data.liveStatistics.matchStatistics) {
          console.log('Updating statistics from WebSocket event');
          setStats(data.liveStatistics);
          
          console.log('Stats updated from live statistics event, forcing UI update');
        }
      },
      onSetScoreUpdated: (data) => {
        console.log('Set score update received:', data);
        console.log('Current set ID:', currentSet?.id);
        console.log('Data set ID:', data.setId);
        
        if (currentSet && data.setId === currentSet.id) {
          console.log('Updating set scores:', {
            old: { home: currentSet.homeScore, away: currentSet.awayScore },
            new: { home: data.homeScore, away: data.awayScore }
          });
          
          // Update current set with new scores
          setCurrentSet(prev => prev ? {
            ...prev,
            homeScore: data.homeScore,
            awayScore: data.awayScore
          } : null);
        } else {
          console.log('Set ID mismatch or no current set');
        }
      },
      onActionUndone: (data) => {
        // Use updated statistics from WebSocket event if available
        if (data.updatedStatistics) {
          console.log('Using updated statistics from action_undone event:', data.updatedStatistics);
          setStats(data.updatedStatistics);
        } else {
          // Fallback to loading stats from server
          console.log('No updated statistics in action_undone event, loading from server');
          loadStats(matchId as string);
        }
        
        // After updating stats, ensure the UI reflects the changes
        if (data.updatedStatistics) {
          console.log('Stats updated from WebSocket after undo, forcing UI update');
        }
        
        // Remove the first action from logs (the one that was undone)
        setActionLogs(prev => prev.slice(1));
        toast.success('Ação desfeita com sucesso');
      }
    }
  );

  // Verificar erros de WebSocket
  useEffect(() => {
    if (wsError) {
      console.error('Erro na conexão WebSocket:', wsError);
      toast.error('Erro na conexão em tempo real. Atualize a página para tentar novamente.');
    } else {
      // When WebSocket reconnects (no error), reload statistics to ensure sync
      if (matchId && !isLoading) {
        console.log('WebSocket reconnected, reloading statistics');
        loadStats(matchId as string);
      }
    }
  }, [wsError, matchId, isLoading, loadStats]);

  // Manipulador de ações
  const handleAction = async (actionType: ActionType, result: ActionResult) => {
    if (!selectedPlayer || !currentSet) {
      toast.error('Selecione um jogador primeiro');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Update score immediately for better UX
      updateScoreImmediately(actionType, result, selectedPlayer.id);
      
      // Register the action
      await registerAction({
        matchId: matchId as string,
        athleteId: selectedPlayer.id,
        actionType,
        result,
        setId: currentSet.id
      });
      
      toast.success('Ação registrada com sucesso');
      
      // Explicitly reload statistics to ensure UI updates
      setTimeout(() => {
        loadStats(matchId as string);
      }, 100);
      
    } catch (error) {
      console.error('Erro ao registrar ação:', error);
      toast.error('Falha ao registrar a ação');
      // Reload stats to sync with server state
      loadStats(matchId as string);
    } finally {
      setIsSaving(false);
    }
  };

  // Manipulador de desfazer
  const handleUndo = async () => {
    if (!currentSet || actionLogs.length === 0) {
      toast.error('Nenhuma ação para desfazer');
      return;
    }
    
    try {
      setIsSaving(true);
      await undoLastAction(matchId as string);
      
      // Atualizar estatísticas após desfazer
      loadStats(matchId as string);
      
      // Remover primeira ação do log
      setActionLogs(prev => prev.slice(1));
      
      toast.success('Ação desfeita com sucesso');
    } catch (error) {
      console.error('Erro ao desfazer ação:', error);
      toast.error('Falha ao desfazer a ação');
    } finally {
      setIsSaving(false);
    }
  };

  // Finalizar set
  const handleEndSet = async () => {
    if (!currentSet) return;
    
    try {
      setIsSaving(true);
      await finalizeSet(currentSet.id);
      setShowEndSetModal(false);
      
      // Recarregar dados
      const [updatedMatch, updatedSets] = await Promise.all([
        getMatch(matchId as string),
        getMatchSets(matchId as string)
      ]);
      
      setMatch(updatedMatch);
      setAllSets(updatedSets);
      setCurrentSet(updatedSets.find(set => set.id === currentSet.id) || null);
      
      toast.success('Set finalizado com sucesso');
    } catch (error) {
      console.error('Erro ao finalizar set:', error);
      toast.error('Falha ao finalizar o set');
    } finally {
      setIsSaving(false);
    }
  };

  // Criar novo set
  const handleCreateNewSet = async () => {
    if (!match) return;
    
    try {
      setIsSaving(true);
      
      console.log('Creating new set for match:', match.id, 'Current status:', match.status);
      
      // Check if match needs to be started first
      if (match.status === 'SCHEDULED') {
        console.log('Match is SCHEDULED, starting match first...');
        await startMatch(match.id);
        console.log('Match started successfully');
        
        // Reload match data after starting
        const updatedMatch = await getMatch(match.id);
        console.log('Updated match status:', updatedMatch.status);
        setMatch(updatedMatch);
        
        // Reload sets to get the newly created first set
        const updatedSets = await getMatchSets(match.id);
        setAllSets(updatedSets);
        const newActiveSet = updatedSets.find(set => set.status === 'IN_PROGRESS');
        setCurrentSet(newActiveSet || null);
        
        toast.success('Partida iniciada com sucesso');
        setShowNewSetModal(false);
        return;
      }
      
      // If match is already IN_PROGRESS, check if there's an active set
      const existingActiveSet = allSets.find(set => set.status === 'IN_PROGRESS');
      if (existingActiveSet) {
        console.log('There is already an active set, cannot create new set');
        toast.error('Já existe um set em andamento. Finalize o set atual antes de criar um novo.');
        setShowNewSetModal(false);
        return;
      }
      
      console.log('Now creating set for match:', match.id);
      const response = await createSet(match.id);
      console.log('Set created successfully:', response);
      const newSet = response.set;
      
      setAllSets(prev => [...prev, newSet]);
      setCurrentSet(newSet);
      setShowNewSetModal(false);
      setActionLogs([]);
      
      toast.success('Novo set iniciado');
    } catch (error) {
      console.error('Erro ao criar novo set:', error);
      console.error('Error details:', {
        matchId: match.id,
        matchStatus: match.status,
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      toast.error('Falha ao criar novo set');
    } finally {
      setIsSaving(false);
    }
  };

  // Finalizar partida
  const handleEndMatch = async () => {
    if (!match) return;
    // ... (rest of the code remains the same)
    
    try {
      setIsSaving(true);
      await endMatch(match.id);
      setShowEndMatchModal(false);
      router.push(`/coach/matches/${match.id}/finalize`);
    } catch (error) {
      console.error('Erro ao finalizar partida:', error);
      toast.error('Falha ao finalizar a partida');
    } finally {
      setIsSaving(false);
    }
  };

  // Exportar estatísticas
  const handleExport = async (format: 'pdf' | 'xlsx' | 'json') => {
    if (!matchId) return;
    
    try {
      setIsSaving(true);
      const blob = await exportMatchStatistics(matchId as string, format);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `match-${match?.homeTeam.name}-vs-${match?.awayTeam.name}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Estatísticas exportadas como ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting statistics:', error);
      toast.error('Falha ao exportar estatísticas');
    } finally {
      setIsSaving(false);
    }
  };
  // Verificar se a partida está em andamento
  const isMatchActive = currentSet?.status === 'IN_PROGRESS';
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando partida...</p>
        </div>
      </div>
    );
  }
  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Partida não encontrada</h2>
          <Button onClick={() => router.push('/coach/matches')}>
            Voltar para partidas
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between flex-col sm:flex-row gap-2 sm:gap-0">
            <div className="w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/coach/matches')}
                className="text-gray-600 hover:bg-gray-100 text-xs sm:text-sm"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Voltar
              </Button>
              <h1 className="text-base sm:text-xl font-bold text-gray-900 mt-1 truncate">
                {match.homeTeam.name} <span className="text-gray-400">x</span> {match.awayTeam.name}
              </h1>
              <div className="flex items-center text-xs sm:text-sm text-gray-500 flex-wrap">
                <span>Set {currentSet?.setNumber} de 5</span>
                {match.location && (
                  <>
                    <span className="mx-1 sm:mx-2">•</span>
                    <span className="truncate">{match.location}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-1 sm:gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
              {isMatchActive && (
                <Button
                  variant="outline"
                  onClick={handleUndo}
                  disabled={isSaving || actionLogs.length === 0}
                  size="sm"
                  className="text-xs sm:text-sm flex-1 sm:flex-none"
                >
                  Desfazer
                </Button>
              )}
              {isMatchActive ? (
                <Button
                  variant="outline"
                  onClick={() => setShowEndSetModal(true)}
                  disabled={isSaving}
                  size="sm"
                  className="text-xs sm:text-sm flex-1 sm:flex-none"
                >
                  Finalizar Set
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => setShowNewSetModal(true)}
                  disabled={isSaving}
                  size="sm"
                  className="text-xs sm:text-sm flex-1 sm:flex-none"
                >
                  Novo Set
                </Button>
              )}
              <Button
                variant="danger"
                onClick={() => setShowEndMatchModal(true)}
                disabled={isSaving}
                size="sm"
                className="text-xs sm:text-sm flex-1 sm:flex-none"
              >
                Finalizar
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {/* Placar */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-4 sm:mb-6">
          <div className="px-3 sm:px-6 py-3 sm:py-5">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center">
              <TeamScore
                team={match.homeTeam}
                score={currentSet?.homeScore || 0}
                isServing={currentSet?.servingTeam === match.homeTeam.id}
                isWinning={(currentSet?.homeScore || 0) > (currentSet?.awayScore || 0)}
              />
              
              <div className="text-center">
                <div className="text-2xl sm:text-4xl font-bold text-gray-900">
                  {currentSet?.homeScore} - {currentSet?.awayScore}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">Set {currentSet?.setNumber}</div>
                <div className="mt-1 sm:mt-2">
                  <Badge variant={isMatchActive ? 'success' : 'default'} size="sm">
                    {isMatchActive ? 'Em andamento' : 'Finalizado'}
                  </Badge>
                </div>
              </div>
              
              <TeamScore
                team={match.awayTeam}
                score={currentSet?.awayScore || 0}
                isServing={currentSet?.servingTeam === match.awayTeam.id}
                isWinning={(currentSet?.awayScore || 0) > (currentSet?.homeScore || 0)}
                alignRight
              />
            </div>
          </div>
        </div>
        {/* Conteúdo principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
          {/* Painel de ações */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-6">
            {/* Seletor de jogador */}
            <Card title="Jogador em Ação" subtitle={
              selectedPlayer 
                ? `Selecionado: ${selectedPlayer.name} (${selectedPlayer.jerseyNumber})`
                : 'Selecione um jogador para registrar ações'
            }>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {match.athletes.map(player => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayer(player)}
                    className={`p-2 sm:p-3 rounded-lg border-2 transition-all text-xs sm:text-sm ${
                      selectedPlayer?.id === player.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-medium text-black truncate">{player.name}</div>
                      <div className="text-xs text-gray-500">#{player.jerseyNumber}</div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
            {/* Ações rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
              {/* Ataque */}
              <Card title="Ofensiva" subtitle="Ações de ataque e saque">
                <div className="grid grid-cols-2 gap-2">
                  {ACTION_BUTTONS.filter(b => ['SERVE', 'ATTACK'].includes(b.type)).map((button) => (
                    <ActionButton
                      key={button.type}
                      button={button}
                      onClick={(result) => handleAction(button.type, result)}
                      disabled={!selectedPlayer || isSaving}
                    />
                  ))}
                </div>
              </Card>
              {/* Defesa */}
              <Card title="Defesa" subtitle="Ações defensivas e recepção">
                <div className="grid grid-cols-3 gap-2">
                  {ACTION_BUTTONS.filter(b => !['SERVE', 'ATTACK'].includes(b.type)).map((button) => (
                    <ActionButton
                      key={button.type}
                      button={button}
                      onClick={(result) => handleAction(button.type, result)}
                      disabled={!selectedPlayer || isSaving}
                    />
                  ))}
                </div>
              </Card>
            </div>
          </div>
          {/* Painel lateral */}
          <div className="space-y-3 sm:space-y-6">
            {/* Estatísticas rápidas */}
            <Card title="Estatísticas" subtitle="Resumo da partida">
              {stats ? (
                <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm text-black">
                  <StatItem 
                    label="Pontos" 
                    homeValue={stats.matchStatistics.teamStatistics.totalPoints || 0} 
                    awayValue={0} 
                  />
                  <StatItem 
                    label="Bloqueios" 
                    homeValue={stats.matchStatistics.teamStatistics.blockPoints || 0} 
                    awayValue={0} 
                  />
                  <StatItem 
                    label="Eficiência de Ataque" 
                    homeValue={Math.round(stats.matchStatistics.teamStatistics.attackEfficiency || 0)} 
                    awayValue={0} 
                  />
                  <StatItem 
                    label="Eficiência de Saque" 
                    homeValue={Math.round(stats.matchStatistics.teamStatistics.serveEfficiency || 0)} 
                    awayValue={0} 
                  />
                  <StatItem 
                    label="Qualidade de Recepção" 
                    homeValue={Math.round(stats.matchStatistics.teamStatistics.receptionQuality || 0)} 
                    awayValue={0} 
                  />
                  <StatItem 
                    label="Erros" 
                    homeValue={stats.matchStatistics.teamStatistics.totalErrors || 0} 
                    awayValue={0} 
                    isError 
                  />
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-xs sm:text-sm">
                  Carregando estatísticas...
                </div>
              )}
            </Card>
            {/* Histórico de ações */}
            <Card title="Histórico" subtitle="Últimas ações">
              <div className="space-y-1 max-h-64 sm:max-h-96 overflow-y-auto pr-2 text-xs sm:text-sm">
                {actionLogs.length > 0 ? (
                  actionLogs.map((log, index) => (
                    <div 
                      key={`${log.id}-${index}`}
                      className="flex items-start p-1 sm:p-2 hover:bg-gray-50 rounded-lg"
                    >
                      <div className="flex-shrink-0 w-2 h-2 mt-1 rounded-full bg-blue-500"></div>
                      <div className="ml-2">
                        <div className="font-medium text-gray-900 truncate">
                          {log.player.name} <span className="text-gray-500">•</span>{' '}
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-gray-600">
                          {getActionLabel(log.type, log.result)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    Nenhuma ação registrada
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
      {/* Modal de finalização de set */}
      <Modal
        isOpen={showEndSetModal}
        onClose={() => setShowEndSetModal(false)}
        title="Finalizar Set"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Tem certeza que deseja finalizar o set atual? O placar será mantido.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowEndSetModal(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleEndSet}
              loading={isSaving}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
      {/* Modal de finalização de partida */}
      <Modal
        isOpen={showEndMatchModal}
        onClose={() => setShowEndMatchModal(false)}
        title="Finalizar Partida"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Tem certeza que deseja finalizar a partida? Você será redirecionado para a página de resumo.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowEndMatchModal(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleEndMatch}
              loading={isSaving}
            >
              Finalizar Partida
            </Button>
          </div>
        </div>
      </Modal>
      {/* Modal de novo set */}
      <Modal
        isOpen={showNewSetModal}
        onClose={() => setShowNewSetModal(false)}
        title="Iniciar Novo Set"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {match?.status === 'SCHEDULED' 
              ? `A partida será iniciada e o set ${allSets.length + 1} começará.`
              : `Iniciar o set ${allSets.length + 1} da partida?`
            }
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowNewSetModal(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateNewSet}
              loading={isSaving}
            >
              {match?.status === 'SCHEDULED' ? 'Iniciar Partida' : 'Iniciar Set'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
// Componentes auxiliares
function TeamScore({ 
  team, 
  score, 
  isServing, 
  isWinning,
  alignRight = false 
}: { 
  team: { id: string; name: string; shortName?: string };
  score: number;
  isServing: boolean;
  isWinning: boolean;
  alignRight?: boolean;
}) {
  return (
    <div className={alignRight ? 'text-right' : ''}>
      <div className="flex items-center" style={alignRight ? { justifyContent: 'flex-end' } : {}}>
        {!alignRight && isServing && (
          <span className="text-yellow-500 mr-2 text-sm">●</span>
        )}
        <h3 className={`text-lg font-medium ${isWinning ? 'text-green-600' : 'text-gray-900'}`}>
          {team.shortName || team.name}
        </h3>
        {alignRight && isServing && (
          <span className="text-yellow-500 ml-2 text-sm">●</span>
        )}
      </div>
      <div className={`text-4xl font-black mt-1 ${isWinning ? 'text-green-600' : 'text-gray-900'}`}>
        {score}
      </div>
    </div>
  );
}
function ActionButton({ 
  button, 
  onClick, 
  disabled = false 
}: { 
  button: ActionButton; 
  onClick: (result: ActionResult) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <button
        onClick={() => onClick(button.results[0].value)}
        disabled={disabled}
        className={`w-full py-3 px-2 rounded-lg text-white font-medium ${button.color} transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
        }`}
      >
        <div className="flex flex-col items-center">
          <span className="text-2xl mb-1">{button.icon}</span>
          <span>{button.label}</span>
        </div>
      </button>
      <div className="grid grid-cols-2 gap-2">
        {button.results.slice(1).map((result) => (
          <button
            key={result.value}
            onClick={() => onClick(result.value)}
            disabled={disabled}
            className="text-xs py-1.5 px-2 bg-gray-700 hover:bg-gray-900 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {result.label}
          </button>
        ))}
      </div>
    </div>
  );
}
function StatItem({ 
  label, 
  homeValue, 
  awayValue,
  isError = false
}: { 
  label: string; 
  homeValue: number; 
  awayValue: number;
  isError?: boolean;
}) {
  const total = homeValue + awayValue;
  const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
  const awayPercent = 100 - homePercent;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span>
          <span className={isError ? 'text-red-500' : 'text-blue-500'}>{homeValue}</span>
          {' - '}
          <span className={isError ? 'text-red-500' : 'text-blue-500'}>{awayValue}</span>
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-full rounded-full ${isError ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${homePercent}%` }}
        ></div>
      </div>
    </div>
  );
}
// Funções auxiliares
function getActionLabel(type: string, result: string): string {
  const action = ACTION_BUTTONS.find(a => a.type === type);
  if (!action) {
    // Handle action types that might not be in ACTION_BUTTONS
    const typeLabels: Record<string, string> = {
      SERVE: 'Saque',
      ATTACK: 'Ataque',
      BLOCK: 'Bloqueio',
      RECEPTION: 'Recepção',
      DEFENSE: 'Defesa',
      SET: 'Levantamento',
      ROTATION: 'Rotação',
      SUBSTITUTION: 'Substituição'
    };
    
    const resultLabels: Record<string, string> = {
      ACE: 'Ace',
      SERVE_IN: 'Em jogo',
      SERVE_ERROR: 'Erro',
      ATTACK_POINT: 'Ponto',
      ATTACK_ERROR: 'Erro',
      ATTACK_BLOCKED: 'Bloqueado',
      BLOCK_POINT: 'Ponto',
      BLOCK_TOUCH: 'Toque',
      BLOCK_MISS: 'Falha',
      RECEPTION_A: 'Excelente (A)',
      RECEPTION_B: 'Boa (B)',
      RECEPTION_C: 'Regular (C)',
      RECEPTION_D: 'Falha (D)',
      DEFENSE_SUCCESS: 'Sucesso',
      DEFENSE_FAIL: 'Falha',
      SET_SUCCESS: 'Sucesso',
      SET_ERROR: 'Erro'
    };
    
    const typeLabel = typeLabels[type] || type;
    const resultLabel = resultLabels[result] || result;
    return `${typeLabel} • ${resultLabel}`;
  }
  
  const resultLabel = action.results.find(r => r.value === result)?.label;
  return `${action.label} • ${resultLabel || result}`;
}