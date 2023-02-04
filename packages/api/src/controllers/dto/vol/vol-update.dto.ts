import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VolUpdateDto {
    @ApiProperty()
    @IsOptional()
    readonly name: string;

    @ApiProperty()
    @IsOptional()
    readonly position: string;
}
