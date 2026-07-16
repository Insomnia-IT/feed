import 'fake-indexeddb/auto';

import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const post = vi.fn();
vi.mock('axios', () => ({
    default: {
        post,
        defaults: {},
        interceptors: { request: { use: vi.fn() } }
    }
}));

const storage = new Map<string, string>();
vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key)
});
vi.stubGlobal('navigator', { onLine: true });

beforeEach(async () => {
    storage.clear();
    storage.set('pin', 'synthetic-pin');
    post.mockReset();
    await Dexie.delete('yclins');
    vi.resetModules();
});

afterEach(async () => {
    const { db } = await import('./db');
    db.close();
    await Dexie.delete('yclins');
});

describe('frontend diagnostic redaction', () => {
    it('redacts nested keys, arrays and secrets embedded in strings', async () => {
        const { sanitizeDiagnosticValue } = await import('./diagnostics');
        const serialized = JSON.stringify(
            sanitizeDiagnosticValue({
                Authorization: 'Bearer top-secret',
                nested: { message: 'request failed password=hunter2 email=user@example.test phone=+7 999 123 45 67' },
                list: ['K-PIN-CODE 1234', 'V-TOKEN qr-secret'],
                name: 'Synthetic Person',
                axios_error: { config: { headers: { Authorization: 'Bearer top-secret' } } }
            })
        );
        for (const secret of ['top-secret', 'hunter2', 'user@example.test', '999 123', '1234', 'qr-secret']) {
            expect(serialized).not.toContain(secret);
        }
        expect(serialized).not.toContain('Synthetic Person');
    });
});

describe('offline diagnostics queue', () => {
    it('survives module reload and is isolated from business transactions', async () => {
        let modules = await import('./db');
        await modules.prepareDatabase();
        await modules.db.transactions.put({
            ulid: '01BUSINESSPENDING000000000001',
            vol_id: null,
            amount: 1,
            ts: 1_700_000_000,
            mealTime: 'lunch',
            is_new: true,
            kitchen: 1
        });
        const diagnostics = await import('./diagnostics');
        await diagnostics.recordDiagnostic('offline');
        modules.db.close();
        vi.resetModules();
        modules = await import('./db');
        await modules.prepareDatabase();
        expect(await modules.db.diagnostics.count()).toBe(1);
        expect(await modules.db.transactions.get('01BUSINESSPENDING000000000001')).toMatchObject({ is_new: true });
    });

    it('enforces TTL, maximum size and removes oldest events', async () => {
        const { db, prepareDatabase } = await import('./db');
        await prepareDatabase();
        await db.diagnostics.put({
            event_id: '01EXPIRED000000000000000001',
            event_type: 'offline',
            occurred_at: new Date(0).toISOString(),
            state: 'degraded',
            details: {},
            attempts: 0,
            next_attempt_at: 0,
            expires_at: 1,
            dedupe_key: 'expired'
        });
        const { recordDiagnostic } = await import('./diagnostics');
        for (let index = 0; index < 505; index += 1) {
            await recordDiagnostic('offline', { index });
        }
        expect(await db.diagnostics.count()).toBe(500);
        expect(await db.diagnostics.get('01EXPIRED000000000000000001')).toBeUndefined();
    });

    it('keeps a failed batch with exponential backoff and deletes it only after success', async () => {
        const { db, prepareDatabase } = await import('./db');
        await prepareDatabase();
        const { recordDiagnostic, uploadDiagnostics } = await import('./diagnostics');
        await recordDiagnostic('offline');
        post.mockRejectedValueOnce(new Error('backend unavailable'));
        await uploadDiagnostics();
        const queued = await db.diagnostics.toCollection().first();
        expect(queued).toMatchObject({ attempts: 1 });
        expect(queued!.next_attempt_at).toBeGreaterThan(Date.now());
        await db.diagnostics.update(queued!.event_id, { next_attempt_at: 0 });
        post.mockResolvedValueOnce({ status: 200 });
        await uploadDiagnostics();
        expect(await db.diagnostics.count()).toBe(0);
    });

    it('preserves events offline and uploads them after going online', async () => {
        const { db, prepareDatabase } = await import('./db');
        await prepareDatabase();
        const { recordDiagnostic, uploadDiagnostics } = await import('./diagnostics');
        await recordDiagnostic('offline');
        vi.stubGlobal('navigator', { onLine: false });
        await uploadDiagnostics();
        expect(post).not.toHaveBeenCalled();
        expect(await db.diagnostics.count()).toBe(1);
        vi.stubGlobal('navigator', { onLine: true });
        post.mockResolvedValueOnce({ status: 200 });
        await uploadDiagnostics();
        expect(await db.diagnostics.count()).toBe(0);
    });
});
