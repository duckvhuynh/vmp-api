import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateVehicleDto } from './create-vehicle.dto';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  @ApiProperty({ 
    description: 'Vehicle ID to update',
    example: '60d5ecb54b8b1c001f5e3f5a',
    required: false
  })
  id?: string;
}
