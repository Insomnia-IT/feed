import { Column, Entity, OneToOne, PrimaryColumn } from 'typeorm';
import { VolEntity } from './vol.entity';

/*
    ulid = db.Column(db.String(256), primary_key=True, unique=True, sqlite_on_conflict_unique='IGNORE')
*/
@Entity({
    name: 'feed_transaction',
    withoutRowid: true,
})
export class FeedTransactionEntity {
    @PrimaryColumn({
        type: 'varchar',
        length: 256,
        unique: true,
    })
    ulid: number;

    @Column({
        type: 'datetime',
    })
    dtime: Date;

    @OneToOne(() => VolEntity, (v) => v.id, {
        eager: true,
        cascade: true,
    })
    vol?: VolEntity;
}
