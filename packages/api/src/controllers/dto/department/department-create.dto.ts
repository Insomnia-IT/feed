import {
    IsNotEmpty,
    IsOptional,
    IsUUID,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class DepartmentCreateLeadDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsUUID()
    readonly id: number;
}

export class DepartmentCreateDto {
    @ApiProperty()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty()
    @IsOptional()
    @Type(() => Array<DepartmentCreateLeadDto>)
    @ValidateNested()
    readonly lead: DepartmentCreateLeadDto[];
}
