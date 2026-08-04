import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateIntervalDto {
  @IsNumber()
  @Min(10000)
  interval: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  setBy?: string;
}
