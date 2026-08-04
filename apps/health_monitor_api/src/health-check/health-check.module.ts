import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthCheckService } from './health-check.service';
import { HealthCheckController, EndpointsController, EndpointGroupController } from './health-check.controller';
import { Endpoint, EndpointSchema } from './schemas/endpoint.schema';
import { EndpointGroup, EndpointGroupSchema } from './schemas/endpoint-group.schema';
import { HealthCheckResult, HealthCheckResultSchema } from './schemas/health-check-result.schema';
import { CheckInterval, CheckIntervalSchema } from '../intervals/schemas/interval.schema';
import { HealthCheckScheduler } from './health-check.scheduler';
import { EndpointGroupService } from './endpoint-group.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Endpoint.name, schema: EndpointSchema },
      { name: EndpointGroup.name, schema: EndpointGroupSchema },
      { name: HealthCheckResult.name, schema: HealthCheckResultSchema },
      { name: CheckInterval.name, schema: CheckIntervalSchema },
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [HealthCheckController, EndpointsController, EndpointGroupController],
  providers: [HealthCheckService, HealthCheckScheduler, EndpointGroupService],
  exports: [HealthCheckService, EndpointGroupService],
})
export class HealthCheckModule {}
