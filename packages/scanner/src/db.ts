import dayjs from 'dayjs';
import type { Collection, Table } from 'dexie';
import Dexie from 'dexie';
import { ulid } from 'ulid';

export interface Transaction {
    ulid: string;
    vol_id: number | null;
    amount: number;
    ts: number;
    mealTime: MealTime;
    is_new: boolean;
    is_vegan?: boolean;
    reason?: string | null;
    kitchen: number;
}

export interface ServerTransaction {
    ulid: string;
    volunteer: number;
    amount: number;
    dtime: string;
    meal_time: MealTime;
    is_vegan: boolean;
    kitchen: number;
}

export interface TransactionJoined extends Transaction {
    vol?: Volunteer;
}

export enum FeedType {
    FT1 = 1, // бесплатно
    FT2 = 2, // платно
    Child = 3, // ребенок,
    FT4 = 4 // без питания
}

export enum MealTime {
    breakfast = 'breakfast',
    lunch = 'lunch',
    dinner = 'dinner',
    night = 'night'
}

export const FeedWithBalance = new Set([FeedType.FT1, FeedType.FT2, FeedType.Child]);

export interface Volunteer {
    qr: string;
    id: number;
    first_name: string;
    name: string;
    balance: number;
    is_blocked: boolean;
    is_vegan: boolean;
    arrivals: Array<Arrival>;
    feed_type: FeedType;
    departments: Array<{ name: string }>;
    kitchen: number;
    group_badge: number | null;

    transactions: Array<Transaction> | null;
}

export interface Arrival {
    id: string;
    status: string;
    arrival_date: string;
    arrival_transport: string;
    departure_date: string;
    departure_transport: string;
}

export interface GroupBadge {
    id: number;
    name: string;
    qr: string;
}

const DB_VERSION = 17;

export class MySubClassedDexie extends Dexie {
    transactions!: Table<Transaction>;
    volunteers!: Table<Volunteer>;
    groupBadges!: Table<GroupBadge>;

    constructor() {
        super('yclins');
        this.version(DB_VERSION)
            .stores({
                transactions: '&&ulid, vol_id, ts',
                volunteers: '&qr, *id, group_badge, *transactions',
                groupBadges: 'id, &qr'
            })
            .upgrade((trans) => {
                return trans.table('volunteers').clear();
            });
    }
}

export const db = new MySubClassedDexie();

export const addTransaction = async ({
    isVegan,
    kitchenId,
    log,
    mealTime,
    vol
}: {
    vol: Volunteer | undefined;
    mealTime: MealTime;
    isVegan: boolean | undefined;
    kitchenId: number;
    log?: {
        error: boolean;
        reason: string;
    };
}): Promise<any> => {
    const ts = dayjs().unix();
    let amount = 1;
    let reason: string | null = null;
    if (log) {
        if (log.error) {
            amount = 0;
        }
        reason = log.reason;
    }
    await db.transactions.add({
        vol_id: vol ? vol.id : null,
        is_vegan: vol ? vol.is_vegan : isVegan,
        ts,
        kitchen: kitchenId,
        amount: amount,
        ulid: ulid(ts),
        mealTime: MealTime[mealTime],
        is_new: true,
        reason: reason
    });
};

export const dbIncFeed = async ({
    isVegan,
    kitchenId,
    log,
    mealTime,
    vol
}: {
    vol: Volunteer | undefined;
    mealTime: MealTime;
    isVegan: boolean | undefined;
    log?: {
        error: boolean;
        reason: string;
    };
    kitchenId: number;
}): Promise<any> => {
    if (vol) {
        await db.volunteers
            .where('id')
            .equals(vol.id)
            .modify({
                balance: vol.balance - 1
            });
    }

    return await addTransaction({ vol, mealTime, isVegan, log, kitchenId });
};

export function joinTxs(txsCollection: Collection<TransactionJoined>): Promise<Array<TransactionJoined>> {
    return txsCollection.toArray((transactions: Array<TransactionJoined>) => {
        const volsPromises = transactions.map((transaction) => {
            return transaction.vol_id ? db.volunteers.get({ id: transaction.vol_id }) : undefined;
        });

        return Dexie.Promise.all(volsPromises).then((vols) => {
            transactions.forEach((transaction: TransactionJoined, i) => {
                transaction.vol = vols[i];
            });
            return transactions;
        });
    });
}

export function isActivatedStatus(status: string): boolean {
    return ['ARRIVED', 'STARTED', 'JOINED'].includes(status);
}

export function getVolsOnField(statsDate: string): Promise<Array<Volunteer>> {
    const kitchenId = localStorage.getItem('kitchenId');
    return db.volunteers
        .filter((vol) => {
            return (
                vol.kitchen.toString() === kitchenId &&
                !vol.is_blocked &&
                vol.feed_type !== FeedType.FT4 &&
                vol.arrivals.some(
                    ({ arrival_date, departure_date, status }) =>
                        dayjs(arrival_date).startOf('day').unix() <= dayjs(statsDate).unix() &&
                        dayjs(departure_date).startOf('day').unix() >= dayjs(statsDate).unix() &&
                        (dayjs(arrival_date).startOf('day').unix() < dayjs(statsDate).unix()
                            ? isActivatedStatus(status)
                            : vol.feed_type === FeedType.FT2
                            ? isActivatedStatus(status)
                            : true)
                )
            );
        })
        .toArray();
}

export function getFeedStats(statsDate: string): Promise<Array<Transaction>> {
    return db.transactions
        .where('ts')
        .between(dayjs(statsDate).add(7, 'h').unix(), dayjs(statsDate).add(31, 'h').unix())
        .filter((tx) => tx.amount !== 0)
        .toArray();
}

export function getLastTrans(offset: number, limit: number): Promise<Array<TransactionJoined>> {
    const txs = db.transactions.reverse().offset(offset).limit(limit);
    return joinTxs(txs);
}
