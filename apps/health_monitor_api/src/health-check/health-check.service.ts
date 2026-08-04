import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as http from 'http';
import * as https from 'https';
import { Endpoint } from './schemas/endpoint.schema';
import { EndpointGroup } from './schemas/endpoint-group.schema';
import { HealthCheckResult } from './schemas/health-check-result.schema';

export interface EndpointStatus {
  id: string;
  name: string;
  url: string;
  status: 'online' | 'offline';
  responseTime?: number;
  statusCode?: number;
  errorMessage?: string;
  checkedAt: Date;
}

@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);

  constructor(
    @InjectModel(Endpoint.name) private endpointModel: Model<Endpoint>,
    @InjectModel(EndpointGroup.name) private endpointGroupModel: Model<EndpointGroup>,
    @InjectModel(HealthCheckResult.name) private resultModel: Model<HealthCheckResult>,
  ) {}

  private checkEndpointPromise(
    url: string,
    timeout: number = 3000,
  ): Promise<{ online: boolean; responseTime: number; statusCode?: number; errorMessage?: string }> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let completed = false;

      const timeoutHandle = setTimeout(() => {
        if (!completed) {
          completed = true;
          resolve({ online: false, responseTime: timeout, statusCode: 0, errorMessage: 'Timeout' });
        }
      }, timeout);

      try {
        const isHttps = url.startsWith('https');
        const protocol = isHttps ? https : http;

        const req = protocol.request(url, { method: 'GET', rejectUnauthorized: false }, (res) => {
          if (!completed) {
            completed = true;
            clearTimeout(timeoutHandle);
            const responseTime = Date.now() - startTime;
            const online = (res.statusCode != null) && res.statusCode >= 200 && res.statusCode < 400;
            resolve({ online, responseTime, statusCode: res.statusCode });
          }
          res.destroy();
        });

        req.on('error', (error) => {
          if (!completed) {
            completed = true;
            clearTimeout(timeoutHandle);
            const responseTime = Date.now() - startTime;
            resolve({
              online: false,
              responseTime,
              statusCode: 0,
              errorMessage: error instanceof Error ? error.message : String(error),
            });
          }
        });

        req.end();
      } catch (error) {
        if (!completed) {
          completed = true;
          clearTimeout(timeoutHandle);
          resolve({
            online: false,
            responseTime: Date.now() - startTime,
            statusCode: 0,
            errorMessage: error instanceof Error ? error.message : String(error),
          });
        }
      }
    });
  }

  async checkAllEndpoints(): Promise<EndpointStatus[]> {
    // Get all active groups
    const activeGroups = await this.endpointGroupModel.find({ active: true });
    const activeGroupIds = activeGroups.map((g) => g._id.toString());

    // Get all active endpoints that belong to active groups
    const endpoints = await this.endpointModel.find({
      active: true,
      groupId: { $in: activeGroupIds },
    }).sort({ sortOrder: 1 });

    this.logger.log(`Checking ${endpoints.length} endpoints from active groups...`);

    const results: EndpointStatus[] = [];

    for (const endpoint of endpoints) {
      try {
        const { online, responseTime, statusCode, errorMessage } = await this.checkEndpointPromise(endpoint.url, 2000);
        const status: 'online' | 'offline' = online ? 'online' : 'offline';

        const result: EndpointStatus = {
          id: endpoint._id.toString(),
          name: endpoint.name,
          url: endpoint.url,
          status,
          responseTime,
          statusCode,
          errorMessage,
          checkedAt: new Date(),
        };

        results.push(result);

        // Store result in database
        await this.resultModel.create({
          endpointId: endpoint._id,
          endpointName: endpoint.name,
          url: endpoint.url,
          status,
          responseTime,
          statusCode,
          errorMessage,
          checkedAt: new Date(),
        });

        this.logger.debug(`${endpoint.name}: ${status} (${responseTime}ms)`);
      } catch (error) {
        this.logger.error(`Error checking ${endpoint.name}: ${error instanceof Error ? error.message : String(error)}`);
        results.push({
          id: endpoint._id.toString(),
          name: endpoint.name,
          url: endpoint.url,
          status: 'offline',
          responseTime: 0,
          statusCode: 0,
          errorMessage: error instanceof Error ? error.message : String(error),
          checkedAt: new Date(),
        });
      }
    }

    return results;
  }

  async getRecentChecks(limit: number = 100): Promise<HealthCheckResult[]> {
    return this.resultModel.find().sort({ checkedAt: -1 }).limit(limit).lean() as unknown as HealthCheckResult[];
  }

  async getChecksByEndpoint(endpointId: string, limit: number = 50): Promise<HealthCheckResult[]> {
    return this.resultModel
      .find({ endpointId })
      .sort({ checkedAt: -1 })
      .limit(limit)
      .lean() as unknown as HealthCheckResult[];
  }

  async getEndpointStats(endpointId: string) {
    const checks = await this.resultModel.find({ endpointId });

    if (checks.length === 0) {
      return null;
    }

    const onlineCount = checks.filter((c) => c.status === 'online').length;
    const offlineCount = checks.filter((c) => c.status === 'offline').length;
    const avgResponseTime = checks.reduce((sum, c) => sum + (c.responseTime || 0), 0) / checks.length;
    const uptime = (onlineCount / checks.length) * 100;

    return {
      totalChecks: checks.length,
      onlineCount,
      offlineCount,
      uptime: uptime.toFixed(2) + '%',
      averageResponseTime: Math.round(avgResponseTime),
    };
  }
}
