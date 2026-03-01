import dayjs from 'dayjs';
import type { Collection, Table } from 'dexie';
import Dexie from 'dexie';
import { ulid } from 'ulid';

import { getToday } from 'shared/lib/date';

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
    group_badge?: number | null;
}

export interface ServerTransaction {
    ulid: string;
    volunteer: number;
    amount: number;
    dtime: string;
    meal_time: MealTime;
    is_vegan: boolean;
    kitchen: number;
    group_badge?: number | null;
}

export interface TransactionJoined extends Transaction {
    vol?: Volunteer;
}

export const FeedType = {
    Free: 1, // бесплатно
    Paid: 2, // платно
    Child: 3, // ребенок
    NoFeed: 4 // без питания
} as const;

export type FeedType = (typeof FeedType)[keyof typeof FeedType];

export const MealTime = {
    breakfast: 'breakfast',
    lunch: 'lunch',
    dinner: 'dinner',
    night: 'night'
} as const;

export type MealTime = (typeof MealTime)[keyof typeof MealTime];

export interface Volunteer {
    qr: string;
    id: number;
    first_name: string;
    name: string;
    is_blocked: boolean;
    is_vegan: boolean;
    deleted_at: string | null;
    arrivals: Array<Arrival>;
    feed_type: FeedType;
    infant: boolean;
    directions: Array<{ name: string }>;
    kitchen: number;
    group_badge: number | null;
    scanner_comment: string | null;
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

export class MySubClassedDexie extends Dexie {
    groupBadges!: Table<GroupBadge>;
    transactions!: Table<Transaction>;
    volunteers!: Table<Volunteer>;

    constructor() {
        super('yclins');
        this.version(20)
            .stores({
                transactions: '&&ulid, vol_id, ts',
                volunteers: '&qr, *id, group_badge, *transactions',
                groupBadges: 'id, &qr'
            })
            .upgrade((trans) => {
                localStorage.removeItem('lastSyncStart');
                localStorage.removeItem('lastUpdatedServerTrans');
                return Promise.all([
                    trans.table('transactions').clear(),
                    trans.table('groupBadges').clear(),
                    trans.table('volunteers').clear()
                ]);
            });
        this.version(21).stores({
            transactions: '&&ulid, vol_id, ts',
            volunteers: null,
            groupBadges: 'id, &qr'
        });
        this.version(22)
            .stores({
                transactions: '&&ulid, vol_id, ts',
                volunteers: 'id, &qr, group_badge',
                groupBadges: 'id, &qr'
            })
            .upgrade(() => {
                console.log('upgrade');
                setTimeout(() => {
                    console.log('reset and reload');
                    localStorage.removeItem('lastSyncStart');
                    window.location.reload();
                }, 1000);
            });
    }
}

export const db = new MySubClassedDexie();

export const addTransaction = async ({
    amount,
    group_badge,
    isVegan,
    kitchenId,
    log,
    mealTime,
    vol
}: {
    vol?: Volunteer | null;
    mealTime: MealTime;
    isVegan: boolean | undefined;
    kitchenId: number;
    log?: {
        error: boolean;
        reason: string;
    };
    group_badge?: number | null;
    amount?: number;
}): Promise<any> => {
    const ts = dayjs().unix();
    let amountInner = amount ?? 1;
    let reason: string | null = null;
    if (log) {
        if (log.error) {
            amountInner = 0;
        }

        reason = log.reason;
    }

    await db.transactions.add({
        vol_id: vol ? vol.id : null,
        is_vegan: vol ? vol.is_vegan : isVegan,
        ts,
        kitchen: kitchenId,
        amount: amountInner,
        ulid: ulid(ts * 1000),
        mealTime: MealTime[mealTime],
        is_new: true,
        reason,
        group_badge
    });
};

export const dbIncFeed = async ({
    amount,
    group_badge,
    isVegan,
    kitchenId,
    log,
    mealTime,
    vol
}: {
    amount?: number;
    group_badge?: number | null;
    vol?: Volunteer | null;
    mealTime: MealTime;
    isVegan?: boolean | undefined;
    log?: {
        error: boolean;
        reason: string;
    };
    kitchenId: number;
}): Promise<any> => {
    return await addTransaction({ amount, group_badge, vol, mealTime, isVegan, log, kitchenId });
};

export function joinTxs(txsCollection: Collection<TransactionJoined>): Promise<Array<TransactionJoined>> {
    return txsCollection.toArray((transactions: Array<TransactionJoined>) => {
        const volsPromises = transactions.map((transaction) => {
            return transaction.vol_id ? db.volunteers.get({ id: transaction.vol_id }) : undefined;
        });

        return Promise.all(volsPromises).then((vols) => {
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
                vol.kitchen?.toString() === kitchenId &&
                !vol.is_blocked &&
                vol.feed_type !== FeedType.NoFeed &&
                vol.arrivals.some(({ arrival_date, departure_date, status }) => {
                    return (
                        dayjs(departure_date).startOf('day').unix() >= dayjs(statsDate).unix() &&
                        dayjs(arrival_date).startOf('day').unix() <= dayjs(statsDate).unix() &&
                        isActivatedStatus(status)
                    );
                })
            );
        })
        .toArray();
}

export function getFeedStats(statsDate: string): Promise<Array<Transaction>> {
    const kitchenId = localStorage.getItem('kitchenId');
    return db.transactions
        .where('ts')
        .between(dayjs(statsDate).add(7, 'h').unix(), dayjs(statsDate).add(31, 'h').unix())
        .filter((tx) => tx.kitchen.toString() === kitchenId && tx.amount !== 0)
        .toArray();
}

export function getLastTrans(offset: number, limit: number): Promise<Array<TransactionJoined>> {
    const kitchenId = localStorage.getItem('kitchenId');
    const txs = db.transactions
        .reverse()
        .offset(offset)
        .limit(limit)
        .filter((tx) => {
            return tx.kitchen.toString() === kitchenId;
        });
    return joinTxs(txs);
}

export function getTodayTrans(): Promise<Array<TransactionJoined>> {
    const kitchenId = localStorage.getItem('kitchenId');
    const today = getToday();
    return db.transactions
        .where('ts')
        .between(dayjs(today).add(7, 'h').unix(), dayjs(today).add(31, 'h').unix())
        .filter((tx) => {
            return tx.kitchen.toString() === kitchenId;
        })
        .toArray();
}
