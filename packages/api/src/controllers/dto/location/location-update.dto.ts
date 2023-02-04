import { IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class LocationUpdateLeadDto {
    @ApiProperty()
    @IsOptional()
    @IsNumber()
    readonly id: number;
}

export class LocationUpdateDto {
    /*
    @ApiProperty()
    @IsNotEmpty()
    id: number;
*/

    @ApiProperty()
    @IsOptional()
    readonly name: string;

    @ApiProperty()
    @IsOptional()
    @Type(() => Array<LocationUpdateLeadDto>)
    @ValidateNested()
    readonly lead: Array<LocationUpdateLeadDto>;
}
