import { registeredJobs } from './jobs';

// The first kernel task replaces this with the outbox relay and BullMQ workers.
console.info(`worker started with ${registeredJobs.length} jobs`);
