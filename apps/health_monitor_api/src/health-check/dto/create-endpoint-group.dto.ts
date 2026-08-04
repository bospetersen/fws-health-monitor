import { IsString, IsNotEmpty } from 'class-validator';

export class CreateEndpointGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
