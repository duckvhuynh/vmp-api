import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message!: string;
}

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: '2025-10-29T10:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '/api/v1/bookings' })
  path!: string;

  @ApiProperty({ example: 'POST' })
  method!: string;

  @ApiProperty({ 
    oneOf: [
      { type: 'string' },
      { type: 'array', items: { type: 'string' } }
    ],
    example: 'Validation failed'
  })
  message!: string | string[];

  @ApiProperty({ example: 'Bad Request' })
  error!: string;
}

