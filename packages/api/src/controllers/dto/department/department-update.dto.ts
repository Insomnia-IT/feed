import { IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class DepartmentUpdateLeadDto {
    @ApiProperty()
    @IsOptional()
    @IsNumber()
    readonly id: number;
}

export class DepartmentUpdateDto {
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
    @Type(() => Array<DepartmentUpdateLeadDto>)
    @ValidateNested()
    readonly lead: Array<DepartmentUpdateLeadDto>;
}
