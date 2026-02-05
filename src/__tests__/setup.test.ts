import { describe, it, expect } from 'vitest';

describe('Frontend Setup', () => {
  it('should verify test environment is working', () => {
    expect(true).toBe(true);
  });

  it('should be able to import shared types', async () => {
    const { UserRole, Position } = await import('@volleyball/shared-types');
    expect(UserRole.COACH).toBe('COACH');
    expect(Position.LIBERO).toBe('LIBERO');
  });
});
