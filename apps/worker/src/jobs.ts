/** Background work the worker runs: outbox relay, event listeners, schedules, AI tasks. */
export interface WorkerJob {
  name: string;
  run(): Promise<void>;
}

export const registeredJobs: WorkerJob[] = [];
