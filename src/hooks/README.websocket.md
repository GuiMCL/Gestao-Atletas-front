# WebSocket Client Implementation

This document describes the WebSocket client implementation for real-time match updates in the Volleyball Management System.

## Overview

The WebSocket client provides real-time communication between the frontend and backend for live match tracking. It implements:

- **Socket.io client connection** with authentication
- **Automatic reconnection logic** with exponential backoff
- **Typed event handlers** for match events
- **React hooks** for easy integration

**Validates: Requirements 7.1, 7.2, 7.3**

## Architecture

### Core Components

1. **useWebSocket** - Base hook for WebSocket connections
2. **useMatchWebSocket** - Match-specific hook with typed events
3. **WebSocketProvider** - Context provider for global state management

## Usage

### Basic Usage with useMatchWebSocket

The simplest way to use WebSocket for match updates:

```typescript
import { useMatchWebSocket } from '@/hooks/useMatchWebSocket';

function LiveMatchPage({ matchId }: { matchId: string }) {
  const { isConnected, error } = useMatchWebSocket({
    matchId,
    onActionRegistered: (data) => {
      console.log('Action registered:', data);
      // Update UI with new action
    },
    onSetFinalized: (data) => {
      console.log('Set finalized:', data);
      // Update UI with finalized set
    },
    onMatchFinalized: (data) => {
      console.log('Match finalized:', data);
      // Navigate to match summary
    },
    onLiveStatisticsUpdate: (data) => {
      console.log('Statistics updated:', data);
      // Update statistics display
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      // Show error message to user
    },
  });

  return (
    <div>
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      {error && <div>Error: {error}</div>}
      {/* Your match UI */}
    </div>
  );
}
```

### Advanced Usage with useWebSocket

For more control and custom events:

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

function CustomMatchComponent({ matchId }: { matchId: string }) {
  const {
    isConnected,
    isConnecting,
    error,
    reconnectAttempt,
    reconnect,
    on,
    off,
    emit,
  } = useWebSocket(matchId, {
    onActionRegistered: (data) => {
      // Handle action
    },
  });

  // Subscribe to custom events
  useEffect(() => {
    const handler = (data: any) => {
      console.log('Custom event:', data);
    };

    on('custom_event', handler);

    return () => {
      off('custom_event', handler);
    };
  }, [on, off]);

  // Emit custom events
  const sendCustomEvent = () => {
    emit('custom_action', { data: 'example' });
  };

  return (
    <div>
      <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
      {isConnecting && <div>Connecting... (Attempt {reconnectAttempt})</div>}
      {error && <div>Error: {error}</div>}
      <button onClick={reconnect}>Reconnect</button>
      <button onClick={sendCustomEvent}>Send Custom Event</button>
    </div>
  );
}
```

### Using WebSocketProvider

For global WebSocket state management:

```typescript
// In your app layout or root component
import { WebSocketProvider } from '@/providers/WebSocketProvider';

export default function RootLayout({ children }) {
  return (
    <WebSocketProvider>
      {children}
    </WebSocketProvider>
  );
}

// In any child component
import { useWebSocketContext } from '@/providers/WebSocketProvider';

function MatchSelector() {
  const { setCurrentMatchId, isConnected } = useWebSocketContext();

  const selectMatch = (matchId: string) => {
    setCurrentMatchId(matchId);
  };

  return (
    <div>
      <div>Global WebSocket: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <button onClick={() => selectMatch('match-123')}>
        Connect to Match 123
      </button>
    </div>
  );
}
```

## Event Types

### Server → Client Events

#### action_registered
Emitted when a match action is registered.

```typescript
interface ActionRegisteredEvent {
  action: any;
  updatedStatistics?: any;
  timestamp: string;
}
```

#### set_finalized
Emitted when a set is finalized.

```typescript
interface SetFinalizedEvent {
  setId: string;
  setStatistics: any;
  timestamp: string;
}
```

#### match_finalized
Emitted when a match is finalized.

```typescript
interface MatchFinalizedEvent {
  matchId: string;
  finalStatistics: any;
  timestamp: string;
}
```

#### live_statistics_update
Emitted with live statistics updates.

```typescript
interface LiveStatisticsUpdateEvent {
  liveStatistics: any;
  timestamp: string;
}
```

### Client → Server Events

#### join_match
Join a match room to receive updates.

```typescript
socket.emit('join_match', { matchId: 'match-123' });
```

#### leave_match
Leave a match room.

```typescript
socket.emit('leave_match', { matchId: 'match-123' });
```

## Authentication

The WebSocket client automatically handles authentication:

1. Retrieves JWT token from localStorage using `getAccessToken()`
2. Checks if token is expired using `isTokenExpired()`
3. Includes token in Socket.io auth handshake
4. Server validates token before accepting connection

If authentication fails:
- Connection is rejected
- Error message is set in hook state
- User should be prompted to log in again

## Reconnection Logic

The client implements automatic reconnection with the following configuration:

- **Maximum attempts**: 5
- **Initial delay**: 1000ms
- **Maximum delay**: 5000ms (exponential backoff)
- **Timeout**: 20000ms

Reconnection events:
- `reconnect_attempt` - Fired on each attempt
- `reconnect` - Fired on successful reconnection
- `reconnect_error` - Fired on reconnection error
- `reconnect_failed` - Fired after max attempts

Manual reconnection:
```typescript
const { reconnect } = useWebSocket(matchId);

// Trigger manual reconnection
reconnect();
```

## Connection States

The hook tracks multiple connection states:

```typescript
interface WebSocketState {
  isConnected: boolean;      // Currently connected
  isConnecting: boolean;     // Connection in progress
  error: string | null;      // Current error message
  reconnectAttempt: number;  // Current reconnection attempt
}
```

## Error Handling

Common errors and how to handle them:

### No Authentication Token
```typescript
error: "No authentication token available"
```
**Solution**: Redirect user to login page

### Token Expired
```typescript
error: "Authentication token expired. Please log in again."
```
**Solution**: Refresh token or redirect to login

### Connection Failed
```typescript
error: "Failed to reconnect after maximum attempts"
```
**Solution**: Show error message and manual reconnect button

### Server Error
```typescript
error: "Invalid or expired authentication token"
```
**Solution**: Clear auth and redirect to login

## Best Practices

1. **Always handle errors**: Provide error callbacks to inform users
2. **Clean up subscriptions**: Use `off()` in useEffect cleanup
3. **Check connection state**: Disable actions when disconnected
4. **Show connection status**: Display connection state to users
5. **Handle reconnection**: Show reconnection attempts to users
6. **Use typed events**: Leverage TypeScript types for type safety

## Testing

Tests are located in:
- `apps/frontend/src/hooks/__tests__/useWebSocket.test.ts`
- `apps/frontend/src/hooks/__tests__/useMatchWebSocket.test.ts`

Run tests:
```bash
npm test
```

## Environment Variables

Configure the WebSocket server URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

The client will connect to this URL with the `/socket.io` path.

## Troubleshooting

### Connection not establishing
1. Check if backend WebSocket server is running
2. Verify `NEXT_PUBLIC_API_URL` is correct
3. Check browser console for errors
4. Verify JWT token is valid

### Events not received
1. Verify you've joined the match room
2. Check if event handlers are registered
3. Verify backend is emitting events
4. Check browser network tab for WebSocket frames

### Frequent disconnections
1. Check network stability
2. Verify token hasn't expired
3. Check server logs for errors
4. Increase timeout configuration if needed

## Related Files

- `apps/frontend/src/hooks/useWebSocket.ts` - Base WebSocket hook
- `apps/frontend/src/hooks/useMatchWebSocket.ts` - Match-specific hook
- `apps/frontend/src/providers/WebSocketProvider.tsx` - Context provider
- `apps/backend/src/services/websocket.service.ts` - Backend WebSocket service
