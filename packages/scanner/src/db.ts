import dayjs from 'dayjs';
import type { Collection, Table } from 'dexie';
import Dexie from 'dexie';
import { ulid } from 'ulid';

import {
    FeedTypeCode,
    getFeedingPermissionForDate as coreGetFeedingPermissionForDate,
    getFeedingPermissionForNow as coreGetFeedingPermissionForNow,
    isActivatedArrivalStatus,
    type FeedingPermissionForDate,
    type FeedingPermissionForNow,
    type PlanningVolunteer
} from '@feed/shared/planning';

import { getToday } from 'shared/lib/date';

export interface Transaction {
    ulid: string;
    vol_id: number | null;
    amount: number;
    ts: number;
    mealTime: MealTime;
    is_new: boolean;
    is_vegan?: boolean | null;
    is_anomaly?: boolean;
    is_paid?: boolean;
    reason?: string | null;
    kitchen: number;
    group_badge?: number | null;
}

export interface ServerTransaction {
    ulid: string;
    volunteer: number | null;
    amount: number;
    dtime: string;
    meal_time: MealTime;
    is_vegan: boolean | null;
    is_paid?: boolean;
    is_anomaly?: boolean;
    reason?: string | null;
    comment?: string | null;
    kitchen: number;
    group_badge?: number | null;
    created_at?: string;
    updated_at?: string;
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

export interface MealPlanCell {
    id?: number;
    group_badge: number;
    group_badge_name?: string | null;
    created_at?: string;
    updated_at?: string;
    date: string;
    meal_time: MealTime;
    amount_meat: number | null;
    amount_vegan: number | null;
}

interface TimeStampedEntity {
    created_at?: string;
    updated_at?: string;
}

export interface VolunteerDirection extends TimeStampedEntity {
    id: string;
    name: string;
    comment?: string | null;
    type?: {
        id: string;
        name: string;
        is_federal?: boolean;
    } | null;
    first_year?: number | null;
    last_year?: number | null;
}

export interface Volunteer extends TimeStampedEntity {
    qr: string;
    id: number;
    uuid?: string;
    gender?: string | null;
    first_name: string | null;
    last_name?: string | null;
    name: string | null;
    position?: string | null;
    is_blocked: boolean;
    is_vegan: boolean;
    is_ticket_received?: boolean | null;
    comment?: string | null;
    direction_head_comment?: string | null;
    badge_number?: string | null;
    printing_batch?: number | null;
    deleted_at: string | null;
    arrivals: Array<Arrival>;
    paid_arrivals?: Array<PaidArrival>;
    feed_type: FeedType | null;
    infant: boolean | null;
    directions: Array<VolunteerDirection>;
    kitchen: number | null;
    group_badge: number | null;
    scanner_comment: string | null;
    access_role?: string | null;
    main_role?: string | null;
    responsible_id?: number | null;
    supervisor_id?: number | null;
    supervisor?: { id: number; name: string } | null;
}

export interface Arrival extends TimeStampedEntity {
    id: string;
    status: string | null;
    arrival_date: string;
    arrival_transport: string | null;
    departure_date: string;
    departure_transport: string | null;
    comment?: string | null;
}

export interface PaidArrival extends TimeStampedEntity {
    id: string;
    arrival_date: string;
    departure_date: string;
    is_free: boolean;
    comment?: string | null;
}

export interface GroupBadge extends TimeStampedEntity {
    id: number;
    name: string;
    qr: string;
    kitchen: number | null;
    planning_cells: Array<MealPlanCell>;
    comment: string | null;
    kitchen_name?: string | null;
    role: string | null;
    volunteer_count: number;
    deleted_at: string | null;
    direction: VolunteerDirection | null;
    is_disabled?: boolean;
}

export type StatisticType = 'plan' | 'fact' | 'predict';
export interface StatisticItem {
    date: string;
    type: StatisticType;
    is_vegan: boolean | null;
    group_badge: boolean | null;
    meal_time: MealTime;
    amount: number;
    kitchen_id: number | null;
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
                // eslint-disable-next-line no-console
                console.log('upgrade');
                setTimeout(() => {
                    // eslint-disable-next-line no-console
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
    isAnomaly,
    isVegan,
    kitchenId,
    log,
    mealTime,
    vol
}: {
    vol?: Volunteer | null;
    mealTime: MealTime;
    isVegan: boolean | undefined;
    isAnomaly?: boolean;
    kitchenId: number;
    log?: {
        error: boolean;
        reason: string;
    };
    group_badge?: number | null;
    amount?: number;
}): Promise<void> => {
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
        is_paid: vol ? shouldMarkTransactionAsPaid(vol) : false,
        ts,
        kitchen: kitchenId,
        amount: amountInner,
        ulid: ulid(ts * 1000),
        mealTime: MealTime[mealTime],
        is_new: true,
        is_anomaly: Boolean(isAnomaly),
        reason,
        group_badge
    });
};

export const dbIncFeed = async ({
    amount,
    group_badge,
    isAnomaly,
    isVegan,
    kitchenId,
    log,
    mealTime,
    vol
}: {
    amount?: number;
    group_badge?: number | null;
    isAnomaly?: boolean;
    vol?: Volunteer | null;
    mealTime: MealTime;
    isVegan?: boolean | undefined;
    log?: {
        error: boolean;
        reason: string;
    };
    kitchenId: number;
}): Promise<void> => {
    await addTransaction({ amount, group_badge, isAnomaly, vol, mealTime, isVegan, log, kitchenId });
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

export const isActivatedStatus = isActivatedArrivalStatus;

const FEED_TYPE_CODE_BY_ID = new Map<FeedType, FeedTypeCode>([
    [FeedType.Free, FeedTypeCode.Free],
    [FeedType.Paid, FeedTypeCode.Paid],
    [FeedType.Child, FeedTypeCode.Child],
    [FeedType.NoFeed, FeedTypeCode.NoFeed]
]);

const toPlanningVolunteer = (vol: Volunteer): PlanningVolunteer => ({
    qr: vol.qr ?? '-',
    is_blocked: vol.is_blocked,
    is_vegan: vol.is_vegan,
    arrivals: vol.arrivals,
    paid_arrivals: vol.paid_arrivals ?? [],
    feed_type_code: vol.feed_type !== null ? (FEED_TYPE_CODE_BY_ID.get(vol.feed_type) ?? null) : null
});

export const getFeedingPermissionForDate = (vol: Volunteer, statsDate: string): FeedingPermissionForDate =>
    coreGetFeedingPermissionForDate(toPlanningVolunteer(vol), statsDate);

export const getFeedingPermissionForNow = (vol: Volunteer): FeedingPermissionForNow =>
    coreGetFeedingPermissionForNow(toPlanningVolunteer(vol));

const shouldMarkTransactionAsPaid = (vol: Volunteer): boolean => {
    const permission = getFeedingPermissionForNow(vol);
    return Boolean(permission.byPaidArrivals && permission.paidArrival && !permission.paidArrival.is_free);
};

export function getVolsOnField(statsDate: string): Promise<Array<Volunteer>> {
    const kitchenId = localStorage.getItem('kitchenId');
    return db.volunteers
        .filter((vol) => {
            return (
                (vol.kitchen?.toString() === kitchenId || vol.group_badge !== null) &&
                !vol.is_blocked &&
                getFeedingPermissionForDate(vol, statsDate).allowed
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
