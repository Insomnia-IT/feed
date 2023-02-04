import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class VolCreateLeadDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsUUID()
    readonly id: number;
}

export class VolCreateDto {
    @ApiProperty()
    @IsOptional()
    readonly name: string;

    @ApiProperty()
    @IsOptional()
    readonly position: string;

    @ApiProperty()
    @IsOptional()
    readonly isActive: string;

    @ApiProperty()
    @IsOptional()
    readonly isBlocked: string;

    @ApiProperty()
    @IsOptional()
    readonly comment: string;
}
