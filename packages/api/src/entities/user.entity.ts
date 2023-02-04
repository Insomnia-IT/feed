import { Exclude } from 'class-transformer';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'user' })
export class UserEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: number;

    @Column()
    username: string;

    @Exclude()
    @Column()
    password: string;

    @Column({ type: 'simple-array', default: '' })
    roles?: string[];

    // sync with notion
    @Column({
        type: 'datetime',
        nullable: true,
    })
    lastSync?: Date;

    // @Column()
    // appPin: string;

    // feed limit reset
    @Column({
        type: 'datetime',
        nullable: true,
    })
    lastReset?: Date;
}
