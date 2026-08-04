import { IsString, IsUrl, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateEndpointDto {
  @IsString()
  name: string;

  @IsUrl()
  url: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
