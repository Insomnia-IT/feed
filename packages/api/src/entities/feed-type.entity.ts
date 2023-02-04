import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { VolEntity } from './vol.entity';

@Entity({ name: 'feed_type' })
export class FeedTypeEntity {
    @PrimaryGeneratedColumn('uuid')
    id: number;

    @Column({
        type: 'varchar',
        length: 256,
        unique: true,
    })
    name: string;

    @Column({
        type: 'boolean',
        default: true,
    })
    paid?: boolean;

    @Column({
        type: 'tinyint',
        default: 0,
        nullable: true,
    })
    dailyAmount: number;

    @OneToMany(() => VolEntity, (v) => v.feedType, {
        cascade: true,
    })
    vol?: VolEntity[];
}
