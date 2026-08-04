import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CheckInterval } from './schemas/interval.schema';
import { UpdateIntervalDto } from './dto/update-interval.dto';

@Injectable()
export class IntervalsService {
  private readonly logger = new Logger(IntervalsService.name);

  constructor(
    @InjectModel(CheckInterval.name) private intervalModel: Model<CheckInterval>,
  ) {}

  async getCurrentInterval() {
    const latest = await this.intervalModel.findOne().sort({ createdAt: -1 }).lean();
    return latest || { interval: 300000, description: 'Default interval (5 minutes)' };
  }

  async setInterval(updateIntervalDto: UpdateIntervalDto) {
    const interval = new this.intervalModel(updateIntervalDto);
    const saved = await interval.save();
    this.logger.log(`New interval set: ${updateIntervalDto.interval}ms`);
    return saved;
  }

  async getIntervalHistory(limit: number = 50) {
    return this.intervalModel.find().sort({ createdAt: -1 }).limit(limit).lean();
  }
}
