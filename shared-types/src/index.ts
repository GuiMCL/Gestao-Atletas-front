// Enums
export enum UserRole {
  ATHLETE = 'ATHLETE',
  COACH = 'COACH',
  ADMIN = 'ADMIN',
}

export enum Position {
  SETTER = 'SETTER',
  OUTSIDE_HITTER = 'OUTSIDE_HITTER',
  OPPOSITE = 'OPPOSITE',
  MIDDLE_BLOCKER = 'MIDDLE_BLOCKER',
  LIBERO = 'LIBERO',
}

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINALIZED = 'FINALIZED',
  CANCELLED = 'CANCELLED',
}

export enum SetStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  FINALIZED = 'FINALIZED',
}

export enum ActionType {
  SERVE = 'SERVE',
  ATTACK = 'ATTACK',
  BLOCK = 'BLOCK',
  RECEPTION = 'RECEPTION',
  DEFENSE = 'DEFENSE',
  SET = 'SET',
  SUBSTITUTION = 'SUBSTITUTION',
  FAULT = 'FAULT',
  ROTATION = 'ROTATION',
}

export enum ActionResult {
  ACE = 'ACE',
  SERVE_ERROR = 'SERVE_ERROR',
  SERVE_IN = 'SERVE_IN',
  ATTACK_POINT = 'ATTACK_POINT',
  ATTACK_ERROR = 'ATTACK_ERROR',
  ATTACK_BLOCKED = 'ATTACK_BLOCKED',
  BLOCK_POINT = 'BLOCK_POINT',
  BLOCK_TOUCH = 'BLOCK_TOUCH',
  BLOCK_MISS = 'BLOCK_MISS',
  RECEPTION_A = 'RECEPTION_A',
  RECEPTION_B = 'RECEPTION_B',
  RECEPTION_C = 'RECEPTION_C',
  RECEPTION_D = 'RECEPTION_D',
  DEFENSE_SUCCESS = 'DEFENSE_SUCCESS',
  DEFENSE_FAIL = 'DEFENSE_FAIL',
  SET_SUCCESS = 'SET_SUCCESS',
  SET_ERROR = 'SET_ERROR',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export enum NotificationType {
  MATCH_REPORT = 'MATCH_REPORT',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
  TEAM_ANNOUNCEMENT = 'TEAM_ANNOUNCEMENT',
}

// User DTOs
export interface UserDTO {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

// Athlete DTOs
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

// Team DTOs
export interface TeamDTO {
  id: string;
  name: string;
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

export interface AthleteRankingDTO {
  rank: number;
  athlete: AthleteDTO;
  metric: string;
  value: number;
}

// Match DTOs
export interface SetDTO {
  id: string;
  setNumber: number;
  homeScore: number;
  awayScore: number;
  status: SetStatus;
  startedAt: string;
  finalizedAt?: string;
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

export interface MatchActionDTO {
  id: string;
  athleteId: string;
  athleteName: string;
  actionType: ActionType;
  result: ActionResult;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Statistics DTOs
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

export interface TeamMatchStatisticsDTO {
  totalPoints: number;
  totalErrors: number;
  attackEfficiency: number;
  serveEfficiency: number;
  blockPoints: number;
  receptionQuality: number;
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

export interface MatchStatisticsDTO {
  matchId: string;
  teamStatistics: TeamMatchStatisticsDTO;
  athleteStatistics: AthleteMatchStatisticsDTO[];
  setStatistics: SetStatisticsDTO[];
}

export interface LiveStatisticsDTO {
  currentSet: SetDTO;
  currentSetStatistics: SetStatisticsDTO;
  matchStatistics: MatchStatisticsDTO;
}

// Trend DTOs
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

// Pagination
export interface PaginationDTO {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// API Request/Response types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDTO;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface CreateMatchRequest {
  date: string;
  location: string;
  opponentTeam: string;
  athleteIds: string[];
}

export interface CreateAthleteRequest {
  name: string;
  email: string;
  position: Position;
  jerseyNumber: number;
  teamId: string;
  photo?: string;
}

export interface UpdateAthleteRequest {
  name?: string;
  position?: Position;
  jerseyNumber?: number;
  photo?: string;
}

export interface RegisterActionRequest {
  setId: string;
  athleteId: string;
  actionType: ActionType;
  result: ActionResult;
  timestamp: string;
  metadata?: Record<string, any>;
}
