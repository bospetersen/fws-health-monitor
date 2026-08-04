import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheckService, EndpointStatus } from './health-check.service';
import { CreateEndpointDto } from './dto/create-endpoint.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Endpoint } from './schemas/endpoint.schema';

@ApiTags('Health Check')
@Controller('health-check')
export class HealthCheckController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    @InjectModel(Endpoint.name) private endpointModel: Model<Endpoint>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get current health status' })
  @ApiResponse({ status: 200, description: 'Health check completed' })
  async checkHealth() {
    return {
      status: 'ok',
      timestamp: new Date(),
      service: 'fws-health-monitor',
    };
  }

  @Post('manual')
  @ApiOperation({ summary: 'Trigger manual health check' })
  @ApiResponse({ status: 200, description: 'Manual health check completed', type: [Object] })
  async manualHealthCheck(): Promise<EndpointStatus[]> {
    return this.healthCheckService.checkAllEndpoints();
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent health check results' })
  @ApiResponse({ status: 200, description: 'Recent checks retrieved', type: [Object] })
  async getRecentChecks(@Query('limit') limit: number = 100) {
    return this.healthCheckService.getRecentChecks(limit);
  }

  @Get('endpoints/:endpointId')
  @ApiOperation({ summary: 'Get checks for specific endpoint' })
  @ApiResponse({ status: 200, description: 'Endpoint checks retrieved' })
  async getEndpointChecks(
    @Param('endpointId') endpointId: string,
    @Query('limit') limit: number = 50,
  ) {
    return this.healthCheckService.getChecksByEndpoint(endpointId, limit);
  }

  @Get('endpoints/:endpointId/stats')
  @ApiOperation({ summary: 'Get statistics for endpoint' })
  @ApiResponse({ status: 200, description: 'Endpoint statistics' })
  async getEndpointStats(@Param('endpointId') endpointId: string) {
    return this.healthCheckService.getEndpointStats(endpointId);
  }
}

@ApiTags('Endpoints')
@Controller('endpoints')
export class EndpointsController {
  constructor(
    @InjectModel(Endpoint.name) private endpointModel: Model<Endpoint>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all monitored endpoints' })
  @ApiResponse({ status: 200, description: 'List of all endpoints' })
  async getAllEndpoints() {
    return this.endpointModel.find();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific endpoint' })
  @ApiResponse({ status: 200, description: 'Endpoint details' })
  async getEndpoint(@Param('id') id: string) {
    return this.endpointModel.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Add new endpoint to monitor' })
  @ApiResponse({ status: 201, description: 'Endpoint created' })
  async createEndpoint(@Body() createEndpointDto: CreateEndpointDto) {
    const endpoint = new this.endpointModel(createEndpointDto);
    return endpoint.save();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update endpoint' })
  @ApiResponse({ status: 200, description: 'Endpoint updated' })
  async updateEndpoint(@Param('id') id: string, @Body() updateData: Partial<CreateEndpointDto>) {
    return this.endpointModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete endpoint from monitoring' })
  @ApiResponse({ status: 200, description: 'Endpoint deleted' })
  async deleteEndpoint(@Param('id') id: string) {
    return this.endpointModel.findByIdAndDelete(id);
  }
}
