import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IntervalsService } from './intervals.service';
import { IntervalsController } from './intervals.controller';
import { CheckInterval, CheckIntervalSchema } from './schemas/interval.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CheckInterval.name, schema: CheckIntervalSchema },
    ]),
  ],
  controllers: [IntervalsController],
  providers: [IntervalsService],
  exports: [IntervalsService],
})
export class IntervalsModule {}
