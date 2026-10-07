import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/**
 * The api app is the only place that wires kernel + enabled modules together.
 * The module loader (first kernel task) reads each enabled module's manifest
 * and registers it here as a NestJS dynamic module.
 */
@Module({ controllers: [HealthController] })
export class AppModule {}
