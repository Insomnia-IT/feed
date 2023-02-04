import {
    IsNotEmpty,
    IsOptional,
    IsUUID,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class LocationCreateLeadDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsUUID()
    readonly id: number;
}

export class LocationCreateDto {
    @ApiProperty()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty()
    @IsOptional()
    @Type(() => Array<LocationCreateLeadDto>)
    @ValidateNested()
    readonly lead: LocationCreateLeadDto[];
}
