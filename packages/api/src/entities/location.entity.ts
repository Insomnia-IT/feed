import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

import { VolEntity } from './vol.entity';

@Entity({ name: 'location' })
export class LocationEntity {
    @PrimaryGeneratedColumn('uuid')
    id: number;

    @Column({
        type: 'varchar',
        length: 256,
    })
    name: string;

    @ManyToMany(() => VolEntity, (v) => v.location, {
        onDelete: 'CASCADE',
    })
    vol: VolEntity;
}
