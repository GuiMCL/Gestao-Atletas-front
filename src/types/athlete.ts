/**
 * Type definitions for athlete-related data structures
 */

export type Position = 'SETTER' | 'OUTSIDE_HITTER' | 'OPPOSITE' | 'MIDDLE_BLOCKER' | 'LIBERO';
export type MatchStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'FINALIZED' | 'CANCELLED';

export interface AthleteDTO {
  id: string;
  userId: string;
  name: string;
  position: Position;
  jerseyNumber: number;
  teamId: string;
  photoUrl?: string;
  bio?: string;
  isActive: boolean;
}

export interface AthleteStatisticsDTO {
  athleteId: string;
  totalMatches: number;
  totalSets: number;
  attackEfficiency: number;
  serveEfficiency: number;
  receptionQuality: number;
  blockEfficiency: number;
  totalPoints: number;
  totalErrors: number;
  averagePointsPerSet: number;
}

export interface TeamDTO {
  id: string;
  name: string;
  athleteCount?: number;
}

export interface MatchSummaryDTO {
  id: string;
  date: string;
  location: string;
  homeTeam: TeamDTO;
  awayTeam: TeamDTO;
  status: MatchStatus;
  finalScore?: string;
}

export interface AthleteProfileResponse {
  athlete: AthleteDTO;
  statistics: AthleteStatisticsDTO;
}

// Match Detail Types
export interface SetDTO {
  id: string;
  setNumber: number;
  homeScore: number;
  awayScore: number;
  status: 'IN_PROGRESS' | 'FINALIZED';
  startedAt: string;
  finalizedAt?: string;
  servingTeam?: string; // ID of the team that is currently serving
}

export interface AthleteMatchStatisticsDTO {
  athleteId: string;
  athleteName: string;
  serves: { total: number; aces: number; errors: number };
  attacks: { total: number; points: number; errors: number; blocked: number };
  blocks: { total: number; points: number; touches: number };
  receptions: { total: number; perfect: number; good: number; poor: number; error: number };
  defenses: { total: number; success: number; fail: number };
  totalPoints: number;
  totalErrors?: number;
}

export interface SetStatisticsDTO {
  setId: string;
  setNumber: number;
  homeScore: number;
  awayScore: number;
  duration: number;
  totalActions: number;
  athleteStatistics: AthleteMatchStatisticsDTO[];
}

export interface TeamMatchStatisticsDTO {
  totalPoints: number;
  totalErrors: number;
  attackEfficiency: number;
  serveEfficiency: number;
  blockPoints: number;
  receptionQuality: number;
}

export interface MatchStatisticsDTO {
  matchId: string;
  teamStatistics: TeamMatchStatisticsDTO;
  athleteStatistics: AthleteMatchStatisticsDTO[];
  setStatistics: SetStatisticsDTO[];
}

export interface MatchDetailDTO {
  id: string;
  date: string;
  location: string;
  homeTeam: TeamDTO;
  awayTeam: TeamDTO;
  status: MatchStatus;
  sets: SetDTO[];
  finalScore?: string;
}

export interface MatchDetailResponse {
  match: MatchDetailDTO;
  statistics: MatchStatisticsDTO;
  personalStatistics: AthleteMatchStatisticsDTO;
}

export interface MatchDTO {
  id: string;
  date: string;
  location: string;
  homeTeam: TeamDTO;
  awayTeam: TeamDTO;
  status: MatchStatus;
  sets: SetDTO[];
  athletes: AthleteDTO[];
}

export interface TeamStatisticsDTO {
  teamId: string;
  totalMatches: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  averageAttackEfficiency: number;
  averageServeEfficiency: number;
  averageReceptionQuality: number;
}

// Action Types
export type ActionType = 
  | 'SERVE' 
  | 'ATTACK' 
  | 'BLOCK' 
  | 'RECEPTION' 
  | 'DEFENSE' 
  | 'SET' 
  | 'SUBSTITUTION' 
  | 'FAULT' 
  | 'ROTATION';

export type ActionResult = 
  | 'ACE'
  | 'SERVE_ERROR'
  | 'SERVE_IN'
  | 'ATTACK_POINT'
  | 'ATTACK_ERROR'
  | 'ATTACK_BLOCKED'
  | 'BLOCK_POINT'
  | 'BLOCK_TOUCH'
  | 'BLOCK_MISS'
  | 'RECEPTION_A'
  | 'RECEPTION_B'
  | 'RECEPTION_C'
  | 'RECEPTION_D'
  | 'DEFENSE_SUCCESS'
  | 'DEFENSE_FAIL'
  | 'SET_SUCCESS'
  | 'SET_ERROR'
  | 'SUCCESS'
  | 'ERROR';

export interface MatchActionDTO {
  id: string;
  athleteId: string;
  athleteName: string;
  actionType: ActionType;
  result: ActionResult;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface LiveStatisticsDTO {
  currentSet: SetDTO;
  currentSetStatistics: SetStatisticsDTO;
  matchStatistics: MatchStatisticsDTO;
}

// Team Analytics Types
export interface AthleteRankingDTO {
  rank: number;
  athlete: AthleteDTO;
  metric: string;
  value: number;
}

export interface TrendDataDTO {
  date: string;
  value: number;
  metric: string;
}

export interface PerformanceDataPoint {
  matchDate: string;
  value: number;
  opponent: string;
}

export interface TeamAnalyticsFilters {
  startDate?: string;
  endDate?: string;
  opponent?: string;
  fundamental?: 'attack' | 'serve' | 'reception' | 'block' | 'defense';
}
