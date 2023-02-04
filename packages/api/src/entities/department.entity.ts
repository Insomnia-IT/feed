import {
    Column,
    Entity,
    ManyToMany,
    PrimaryGeneratedColumn,
    JoinTable,
} from 'typeorm';

import { VolEntity } from '@feed/api/src/entities/vol.entity';

@Entity({ name: 'department' })
export class DepartmentEntity {
    @PrimaryGeneratedColumn('uuid')
    id: number;

    @Column({
        type: 'varchar',
        length: 256,
    })
    name: string;

    @ManyToMany(() => VolEntity, (v) => v.department, {
        onDelete: 'CASCADE',
    })
    @JoinTable()
    lead: VolEntity;
}
