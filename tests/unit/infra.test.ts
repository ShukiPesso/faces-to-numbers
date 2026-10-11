import { describe, expect, it } from 'vitest';

describe('test infrastructure', () => {
  it('runs unit tests in the node environment', () => {
    expect(typeof document).toBe('undefined');
    expect(1 + 1).toBe(2);
  });
});
