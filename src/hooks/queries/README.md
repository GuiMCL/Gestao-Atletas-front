# React Query Hooks

This directory contains React Query (TanStack Query) hooks for all API endpoints in the Volleyball Management System.

## Overview

React Query provides:
- **Automatic caching** - Reduces unnecessary API calls
- **Background refetching** - Keeps data fresh automatically
- **Optimistic updates** - Instant UI feedback for mutations
- **Request deduplication** - Prevents duplicate requests
- **Automatic retries** - Handles transient failures
- **DevTools** - Debug queries and cache in development

## Structure

```
hooks/queries/
├── useAuthQueries.ts         # Authentication (login, logout, password reset)
├── useAthleteQueries.ts      # Athlete management and profiles
├── useMatchQueries.ts        # Match management and live tracking
├── useTeamQueries.ts         # Team management and analytics
├── useNotificationQueries.ts # User notifications
├── useUserQueries.ts         # User management (admin)
└── index.ts                  # Central export
```

## Usage

### Basic Query

```typescript
import { useAthleteProfile } from '@/hooks/queries';

function AthleteProfile({ athleteId }: { athleteId: string }) {
  const { data, isLoading, error } = useAthleteProfile(athleteId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{data.athlete.name}</div>;
}
```

### Mutation with Optimistic Update

```typescript
import { useRegisterAction } from '@/hooks/queries';

function ActionButton({ matchId, setId, athleteId }: Props) {
  const registerAction = useRegisterAction();

  const handleClick = () => {
    registerAction.mutate({
      matchId,
      data: {
        setId,
        athleteId,
        actionType: 'SERVE',
        result: 'ACE',
      },
    });
  };

  return (
    <button onClick={handleClick} disabled={registerAction.isPending}>
      Register Serve Ace
    </button>
  );
}
```

### Dependent Queries

```typescript
import { useMatch, useMatchSets } from '@/hooks/queries';

function MatchDetail({ matchId }: { matchId: string }) {
  const { data: match } = useMatch(matchId);
  // Sets query only runs when match is loaded
  const { data: sets } = useMatchSets(matchId);

  return (
    <div>
      <h1>{match?.homeTeam.name} vs {match?.awayTeam.name}</h1>
      <SetList sets={sets?.sets} />
    </div>
  );
}
```

### Real-time Updates

```typescript
import { useLiveStatistics } from '@/hooks/queries';

function LiveMatchStats({ matchId, isLive }: Props) {
  // Automatically refetches every 5 seconds when enabled
  const { data } = useLiveStatistics(matchId, isLive);

  return <StatsDisplay stats={data} />;
}
```

## Query Keys

Query keys are centrally managed in `@/lib/query-client.ts` for consistency:

```typescript
import { queryKeys } from '@/lib/query-client';

// Examples:
queryKeys.athletes.detail('athlete-123')
queryKeys.matches.liveStatistics('match-456')
queryKeys.teams.rankings('team-789')
```

## Cache Invalidation

Use the `invalidateQueries` helpers for manual cache invalidation:

```typescript
import { invalidateQueries } from '@/lib/query-client';

// Invalidate all athlete queries
invalidateQueries.athletes();

// Invalidate specific athlete
invalidateQueries.athlete('athlete-123');

// Invalidate all matches
invalidateQueries.matches();
```

## Optimistic Updates

Mutations that affect real-time data use optimistic updates:

1. **useRegisterAction** - Updates live statistics immediately
2. **useMarkNotificationAsRead** - Updates notification state instantly
3. **useDeleteNotification** - Removes notification from UI immediately

These provide instant feedback while the server processes the request.

## Configuration

Default query options are configured in `@/lib/query-client.ts`:

- **Stale time**: 5 minutes (data considered fresh)
- **Cache time**: 10 minutes (unused data retention)
- **Retry**: 3 attempts with exponential backoff
- **Refetch on window focus**: Enabled
- **Refetch on reconnect**: Enabled

## DevTools

React Query DevTools are available in development mode:
- Press the floating icon in the bottom-right corner
- View all queries, their status, and cached data
- Manually trigger refetches or invalidations
- Debug query behavior

## Best Practices

1. **Use query keys consistently** - Always use the centralized `queryKeys` object
2. **Enable queries conditionally** - Use the `enabled` option for dependent queries
3. **Invalidate related queries** - After mutations, invalidate affected queries
4. **Handle loading and error states** - Always provide feedback to users
5. **Use optimistic updates sparingly** - Only for instant feedback on critical actions
6. **Leverage stale-while-revalidate** - Let React Query handle background updates

## Requirements Validation

This implementation satisfies:
- **Requirement 2.5**: Statistics updates reflected within 5 seconds (via refetch intervals)
- **Requirement 7.1**: Real-time updates during active matches (via live statistics polling)
