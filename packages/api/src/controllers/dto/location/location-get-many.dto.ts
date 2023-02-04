import { Expose, Exclude, Type } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

import { LocationDto } from './location.dto';

@Exclude()
export class LocationGetManyDto {
    @Expose()
    @Type(() => LocationDto)
    @ApiProperty({
        type: LocationDto,
    })
    data: LocationDto[];

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
