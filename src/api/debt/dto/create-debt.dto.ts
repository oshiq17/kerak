import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDebtDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  productName: string;

  @ApiProperty()
  @IsNotEmpty()
  date: Date;

  @ApiProperty()
  @IsNotEmpty()
  term: number;

  @ApiProperty()
  @IsOptional()
  note?: string;

  @ApiProperty()
  @IsNotEmpty()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  debtorId: string;
}
