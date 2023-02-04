import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { VolEntity } from './vol.entity';

@Entity({ name: 'badge' })
export class BadgeEntity {
    @PrimaryGeneratedColumn('uuid')
    id: number;

    @Column({
        type: 'varchar',
        length: 256,
    })
    name: string;

    @Column({
        type: 'varchar',
        length: 256,
    })
    descr: string;

    @OneToOne(() => VolEntity, (v) => v.location, {
        onDelete: 'CASCADE',
    })
    vol: VolEntity;
}
