import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class PlaceDto {
  @ApiProperty({ enum: ['airport', 'address'], example: 'airport' })
  @IsString()
  @IsNotEmpty()
  type!: 'airport' | 'address';

  @ApiProperty({ required: false, example: 'MRU', description: 'IATA code when type=airport' })
  @IsOptional()
  @IsString()
  airportCode?: string;

  @ApiProperty({ required: false, example: 'T1' })
  @IsOptional()
  @IsString()
  terminal?: string;

  @ApiProperty({ required: false, example: 'Port Louis, Mauritius' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class CreateQuoteDto {
  @ApiProperty({ type: PlaceDto, description: 'Origin place (airport or address)' })
  origin!: PlaceDto;

  @ApiProperty({ type: PlaceDto, description: 'Destination place (airport or address)' })
  destination!: PlaceDto;

  @ApiProperty({ example: '2025-09-04T10:00:00.000Z' })
  @IsDateString()
  pickupAt!: string;

  @ApiProperty({ minimum: 1, example: 2 })
  @IsInt()
  @Min(1)
  pax!: number;

  @ApiProperty({ minimum: 0, example: 2 })
  @IsInt()
  @Min(0)
  bags!: number;

  @ApiProperty({ required: false, type: [String], example: ['child_seat'] })
  @IsOptional()
  @IsArray()
  extras?: string[];
}

export class QuoteVehicleClassDto {
  @ApiProperty({ example: 'sedan' }) id!: string;
  @ApiProperty({ example: 'Sedan' }) name!: string;
  @ApiProperty({ example: 3 }) paxCap!: number;
  @ApiProperty({ example: 2 }) bagCap!: number;
  @ApiProperty({ example: 35 }) total!: number;
}

export class QuoteResponseDto {
  @ApiProperty({ example: '4f1a0d8c-94c8-4f9a-b0a6-2cb0d1a0f6c1' }) quoteId!: string;
  @ApiProperty({ example: 'USD' }) currency!: string;
  @ApiProperty({ example: 35 }) total!: number;
  @ApiProperty({ example: { base: 30, extras: 5 } }) breakdown!: Record<string, number>;
  @ApiProperty({ type: [QuoteVehicleClassDto] }) classes!: QuoteVehicleClassDto[];
  @ApiProperty({ example: { cancellation: 'Free until 24h', includedWait: '60 min after ATA' } })
  policy!: Record<string, string>;
}
