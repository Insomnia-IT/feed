import { Expose, Exclude, Transform } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';
import { AfterLoad } from 'typeorm';

// TODO check https://github.com/typeorm/typeorm/issues/9323

@Exclude()
export class VolDto {
    @Expose()
    @ApiProperty()
    id: number;

    @Expose()
    @ApiProperty()
    name: string;

    @Expose()
    @ApiProperty()
    nick: string;

    @Expose()
    @ApiProperty()
    fullName: string;

    @Expose()
    @ApiProperty({ nullable: true })
    position: string;

    @Expose()
    @ApiProperty()
    isActive: string;

    @Expose()
    @ApiProperty()
    isBlocked: string;

    @Expose()
    // @ApiProperty()
    @Exclude({ toPlainOnly: true })
    activeFrom: Date;

    @Expose()
    @ApiProperty()
    activeTo: Date;

    @Expose()
    @ApiProperty()
    comment: string;
}
