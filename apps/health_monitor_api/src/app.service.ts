import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'FWS Health Monitor Service is running!';
  }

  getStatus() {
    return {
      service: 'fws-health-monitor',
      status: 'running',
      timestamp: new Date(),
      version: '1.0.0',
    };
  }
}
