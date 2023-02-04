import {
    BeforeInsert,
    Column,
    Entity,
    ManyToMany,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    AfterLoad,
} from 'typeorm';
import { nanoid } from 'nanoid';
import { DepartmentEntity } from './department.entity';
import { LocationEntity } from './location.entity';
import { BadgeEntity } from './badge.entity';
import { FeedTypeEntity } from './feed-type.entity';

/*
    # on_conflict = 'IGNORE', on_conflict_unique = 'IGNORE',
     connection.createQueryBuilder().onConflict(`("id") DO NOTHING`)
*/

/*
* def before_update(mapper, connection, target):
    state = db.inspect(target)
    changes = {}
    change_feed = None
    active_from = None

    pprint('before_update')

    for attr in state.attrs:
        hist = attr.load_history()

        if not hist.has_changes():
            continue

        # hist.deleted holds old value
        # hist.added holds new value
        changes[attr.key] = hist.added
        if attr.key == 'feed_type_id':
            change_feed = hist.added[0]
        if attr.key == 'active_from':
            active_from = hist.added[0]

    pprint(changes)

    if change_feed is not None:
        if target.daily_eats == 0:
            ft = Feed_type.query.filter(Feed_type.id == change_feed).first()
            target.daily_eats = ft.daily_amount

    if active_from is not None and active_from.date() <= datetime.date.today():
        if target.daily_eats == 0:
            ft = Feed_type.query.filter(Feed_type.id == target.feed_type_id).first()
            target.daily_eats = ft.daily_amount
* */

@Entity({ name: 'Vol' })
export class VolEntity {
    @PrimaryGeneratedColumn('uuid')
    id: number;

    @Column({
        type: 'varchar',
        length: 256,
        unique: true,
    })
    uuid?: string;

    @Column({
        type: 'varchar',
        length: 256,
        nullable: true,
        unique: true,
    })
    qr?: string;

    @Column({
        type: 'varchar',
        length: 256,
        nullable: true,
    })
    name?: string;

    @Column({
        type: 'varchar',
        length: 256,
        nullable: true,
    })
    nick?: string;

    fullName?: string;

    @Column({
        type: 'varchar',
        length: 256,
        nullable: true,
    })
    phone?: string;

    @Column({
        type: 'varchar',
        length: 256,
        nullable: true,
    })
    email?: string;

    @Column({
        type: 'varchar',
        length: 2048,
        nullable: true,
    })
    photo?: string;

    @Column({
        type: 'varchar',
        length: 2048,
        nullable: true,
    })
    position?: string;

    @Column({
        type: 'varchar',
        length: 256,
        nullable: true,
    })
    nutritionType?: string;

    @Column({
        type: 'boolean',
        default: false,
    })
    isActive?: boolean;

    @Column({
        type: 'boolean',
        default: false,
    })
    isBlocked?: boolean;

    @Column({
        type: 'tinyint',
        default: 0,
        nullable: true,
    })
    dailyEats?: number;

    @Column({
        type: 'datetime',
        nullable: true,
    })
    activeFrom?: Date;

    @Column({
        type: 'varchar',
        nullable: true,
    })
    comment?: string;

    @Column({
        type: 'datetime',
        nullable: true,
    })
    activeTo?: Date;

    @Column({
        type: 'date',
        nullable: true,
    })
    arrivalDate?: Date;

    @Column({
        type: 'date',
        nullable: true,
    })
    departureDate?: Date;

    @OneToMany(() => VolEntity, (v) => v.id, {
        eager: true,
        cascade: true,
    })
    chef?: VolEntity[];

    @ManyToMany(() => DepartmentEntity, (d) => d.lead, {
        eager: true,
        cascade: true,
    })
    department?: DepartmentEntity[];

    @ManyToMany(() => LocationEntity, (l) => l.vol, {
        eager: true,
        cascade: true,
    })
    location?: LocationEntity[];

    @OneToOne(() => BadgeEntity, (b) => b.id, {
        eager: true,
        cascade: true,
    })
    badgeType?: BadgeEntity;

    @OneToOne(() => FeedTypeEntity, (b) => b.vol, {
        eager: true,
    })
    feedType?: FeedTypeEntity;

    @BeforeInsert()
    beforeInsertAction(): void {
        this.uuid = this.uuid || nanoid().substring(0, 7);
    }
    /*
    @AfterUpdate()
    afterUpdateAction(): void {
        console.log(this.feedType);
    }
*/

    // computed
    @AfterLoad()
    computeFullName(): void {
        const nick = this.nick ? `(${this.nick})` : '';
        this.fullName = [this.name, nick].filter(Boolean).join(' ');
    }
}
