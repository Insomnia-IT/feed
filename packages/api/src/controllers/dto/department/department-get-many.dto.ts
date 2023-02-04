import { Expose, Exclude, Type } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

import { DepartmentDto } from './department.dto';

@Exclude()
export class DepartmentGetManyDto {
    @Expose()
    @Type(() => DepartmentDto)
    @ApiProperty({
        type: DepartmentDto,
    })
    data: DepartmentDto[];

    @Expose()
    @ApiProperty()
    count: number;

    @Expose()
    @ApiProperty()
    total: number;

    @Expose()
    @ApiProperty()
    page: number;

    @Expose()
    @ApiProperty()
    pageCount: number;
}
