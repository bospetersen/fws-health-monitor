import { IsString, IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class UpdateEndpointGroupDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
