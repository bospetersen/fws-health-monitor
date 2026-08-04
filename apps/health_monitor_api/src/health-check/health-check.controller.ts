import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheckService, EndpointStatus } from './health-check.service';
import { CreateEndpointDto } from './dto/create-endpoint.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Endpoint } from './schemas/endpoint.schema';
import { EndpointGroup } from './schemas/endpoint-group.schema';
import { EndpointGroupService } from './endpoint-group.service';
import { CreateEndpointGroupDto } from './dto/create-endpoint-group.dto';
import { UpdateEndpointGroupDto } from './dto/update-endpoint-group.dto';

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

  @Put(':id/reorder')
  @ApiOperation({ summary: 'Reorder endpoints' })
  @ApiResponse({ status: 200, description: 'Endpoints reordered' })
  async reorderEndpoints(@Body() endpoints: { id: string; sortOrder: number }[]) {
    const updated = await Promise.all(
      endpoints.map((endpoint) =>
        this.endpointModel.findByIdAndUpdate(endpoint.id, { sortOrder: endpoint.sortOrder }, { new: true }).exec(),
      ),
    );
    return updated;
  }
}

@ApiTags('Endpoint Groups')
@Controller('endpoint-groups')
export class EndpointGroupController {
  constructor(private readonly endpointGroupService: EndpointGroupService) {}

  @Get()
  @ApiOperation({ summary: 'Get all endpoint groups' })
  @ApiResponse({ status: 200, description: 'List of all groups' })
  async getAllGroups(): Promise<EndpointGroup[]> {
    return this.endpointGroupService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific endpoint group' })
  @ApiResponse({ status: 200, description: 'Group details' })
  async getGroup(@Param('id') id: string): Promise<EndpointGroup | null> {
    return this.endpointGroupService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new endpoint group' })
  @ApiResponse({ status: 201, description: 'Group created' })
  async createGroup(@Body() createEndpointGroupDto: CreateEndpointGroupDto): Promise<EndpointGroup> {
    return this.endpointGroupService.create(createEndpointGroupDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update endpoint group' })
  @ApiResponse({ status: 200, description: 'Group updated' })
  async updateGroup(
    @Param('id') id: string,
    @Body() updateEndpointGroupDto: UpdateEndpointGroupDto,
  ): Promise<EndpointGroup | null> {
    return this.endpointGroupService.update(id, updateEndpointGroupDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete endpoint group' })
  @ApiResponse({ status: 200, description: 'Group deleted' })
  async deleteGroup(@Param('id') id: string): Promise<EndpointGroup | null> {
    return this.endpointGroupService.delete(id);
  }

  @Put(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle group active status' })
  @ApiResponse({ status: 200, description: 'Group status toggled' })
  async toggleActive(@Param('id') id: string): Promise<EndpointGroup> {
    return this.endpointGroupService.toggleActive(id);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder groups' })
  @ApiResponse({ status: 200, description: 'Groups reordered' })
  async reorderGroups(@Body() groups: { id: string; sortOrder: number }[]): Promise<EndpointGroup[]> {
    return this.endpointGroupService.reorderGroups(groups);
  }
}
