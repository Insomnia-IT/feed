import 'fake-indexeddb/auto';

import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const storage = new Map<string, string>();
vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key)
});

const pendingTransaction = {
    ulid: '01TESTPENDINGTRANSACTION0001',
    vol_id: null,
    amount: 1,
    ts: 1_700_000_000,
    mealTime: 'lunch',
    is_new: true,
    kitchen: 1
};
const sentTransaction = { ...pendingTransaction, ulid: '01TESTSENTTRANSACTION0000001', is_new: false };

const createOldDatabase = async (version: number): Promise<void> => {
    const old = new Dexie('yclins');
    old.version(version).stores({
        transactions: '&&ulid, vol_id, ts',
        volunteers:
            version === 21 ? null : version <= 20 ? '&qr, *id, group_badge, *transactions' : 'id, &qr, group_badge',
        groupBadges: 'id, &qr'
    });
    await old.open();
    await old.table('transactions').bulkPut([pendingTransaction, sentTransaction]);
    if (version !== 21) await old.table('volunteers').put({ id: 1, qr: 'synthetic-qr', transactions: [] });
    await old.table('groupBadges').put({ id: 1, qr: 'synthetic-group-qr' });
    old.close();
};

describe.each([19, 20, 21, 22])('Dexie upgrade from schema %i', (version) => {
    beforeEach(async () => {
        storage.clear();
        await Dexie.delete('yclins');
        vi.resetModules();
    });

    afterEach(async () => {
        const { db } = await import('./db');
        db.close();
        await Dexie.delete('yclins');
    });

    it('preserves every unsent business transaction', async () => {
        await createOldDatabase(version);
        const { db, prepareDatabase } = await import('./db');
        await prepareDatabase();
        expect(await db.transactions.get(pendingTransaction.ulid)).toMatchObject({ is_new: true, amount: 1 });
    });
});

describe('current schema isolation', () => {
    beforeEach(async () => {
        await Dexie.delete('yclins');
        vi.resetModules();
    });

    it('does not let diagnostics modify or delete transactions', async () => {
        const { db, prepareDatabase } = await import('./db');
        await prepareDatabase();
        await db.transactions.put(pendingTransaction as never);
        await db.diagnostics.put({
            event_id: '01DIAGNOSTIC0000000000000001',
            event_type: 'offline',
            occurred_at: new Date().toISOString(),
            state: 'degraded',
            details: {},
            attempts: 0,
            next_attempt_at: 0,
            expires_at: 1,
            dedupe_key: 'offline'
        });
        await db.diagnostics.clear();
        expect(await db.transactions.get(pendingTransaction.ulid)).toMatchObject({ is_new: true });
        db.close();
    });
});
