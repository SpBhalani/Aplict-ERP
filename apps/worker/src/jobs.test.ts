import { describe, expect, it } from 'vitest';
import { registeredJobs } from './jobs';

describe('worker jobs', () => {
  it('starts with an empty job list', () => {
    expect(registeredJobs).toEqual([]);
  });
});
