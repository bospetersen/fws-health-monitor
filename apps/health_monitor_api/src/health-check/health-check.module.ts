import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthCheckService } from './health-check.service';
import { HealthCheckController, EndpointsController } from './health-check.controller';
import { Endpoint, EndpointSchema } from './schemas/endpoint.schema';
import { HealthCheckResult, HealthCheckResultSchema } from './schemas/health-check-result.schema';
import { CheckInterval, CheckIntervalSchema } from '../intervals/schemas/interval.schema';
import { HealthCheckScheduler } from './health-check.scheduler';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Endpoint.name, schema: EndpointSchema },
      { name: HealthCheckResult.name, schema: HealthCheckResultSchema },
      { name: CheckInterval.name, schema: CheckIntervalSchema },
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [HealthCheckController, EndpointsController],
  providers: [HealthCheckService, HealthCheckScheduler],
  exports: [HealthCheckService],
})
export class HealthCheckModule {}
