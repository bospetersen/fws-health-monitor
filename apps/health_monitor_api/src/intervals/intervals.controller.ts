import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IntervalsService } from './intervals.service';
import { UpdateIntervalDto } from './dto/update-interval.dto';

@ApiTags('Intervals')
@Controller('intervals')
export class IntervalsController {
  constructor(private readonly intervalsService: IntervalsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current check interval' })
  @ApiResponse({ status: 200, description: 'Current interval retrieved' })
  async getCurrentInterval() {
    return this.intervalsService.getCurrentInterval();
  }

  @Post()
  @ApiOperation({ summary: 'Set new check interval' })
  @ApiResponse({ status: 201, description: 'New interval set' })
  async setInterval(@Body() updateIntervalDto: UpdateIntervalDto) {
    return this.intervalsService.setInterval(updateIntervalDto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get interval change history' })
  @ApiResponse({ status: 200, description: 'Interval history retrieved' })
  async getIntervalHistory(@Query('limit') limit: number = 50) {
    return this.intervalsService.getIntervalHistory(limit);
  }
}
