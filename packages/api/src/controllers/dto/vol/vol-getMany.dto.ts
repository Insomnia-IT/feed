import { Expose, Exclude, Type } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

import { VolDto } from './vol.dto';

@Exclude()
export class VolGetManyDto {
    @Expose()
    @Type(() => VolDto)
    @ApiProperty({
        type: VolDto,
    })
    data: VolDto[];

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

    @Expose()
    @ApiProperty()
    readonly isActive: string;

    @Expose()
    @ApiProperty()
    readonly isBlocked: string;

    @Expose()
    @ApiProperty()
    readonly comment: string;
}
