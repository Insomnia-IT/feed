import { Expose, Exclude, Type } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

import { VolDto } from '../vol/vol.dto';

@Exclude()
export class LocationDto {
    @Expose()
    @ApiProperty()
    id: number;

    @Expose()
    @ApiProperty()
    name: string;

    @Expose()
    @Type(() => Array<VolDto>)
    @ApiProperty({
        type: VolDto,
        nullable: true,
    })
    lead: VolDto[];
}
