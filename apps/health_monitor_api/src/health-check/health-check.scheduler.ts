import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HealthCheckService } from './health-check.service';
import { CheckInterval } from '../intervals/schemas/interval.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthCheckScheduler implements OnModuleInit {
  private readonly logger = new Logger(HealthCheckScheduler.name);
  private intervalId: NodeJS.Timeout;
  private currentInterval: number;

  constructor(
    private readonly healthCheckService: HealthCheckService,
    @InjectModel(CheckInterval.name) private intervalModel: Model<CheckInterval>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Initialize default interval from config
    const defaultInterval = this.configService.get<number>('CHECK_INTERVAL') || 300000; // 5 minutes default

    // Get the latest interval from database
    const latestInterval = await this.intervalModel.findOne().sort({ createdAt: -1 });
    this.currentInterval = latestInterval?.interval || defaultInterval;

    this.logger.log(`Initializing health check scheduler with interval: ${this.currentInterval}ms`);

    // Run immediate check on startup
    await this.runHealthCheck();

    // Start scheduled checks
    this.startScheduler();
  }

  private startScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(async () => {
      await this.runHealthCheck();
    }, this.currentInterval);

    this.logger.log(`Health check scheduler started (interval: ${this.currentInterval}ms)`);
  }

  private async runHealthCheck() {
    this.logger.debug('Running scheduled health check...');
    try {
      const results = await this.healthCheckService.checkAllEndpoints();
      const onlineCount = results.filter((r) => r.status === 'online').length;
      this.logger.log(`Health check completed: ${onlineCount}/${results.length} endpoints online`);
    } catch (error) {
      this.logger.error('Error during scheduled health check:', error);
    }
  }

  async updateInterval(newInterval: number) {
    this.currentInterval = newInterval;
    this.logger.log(`Check interval updated to ${newInterval}ms`);
    this.startScheduler();
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
