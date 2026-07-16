import axios from 'axios';
import { ulid } from 'ulid';

import { API_DOMAIN } from 'config';
import { db, type DiagnosticEvent } from 'db';

const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'dev';
const MAX_EVENTS = 500;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
let uploading = false;

export const getDeviceId = (): string => {
    const existing = localStorage.getItem('diagnosticDeviceId');
    if (existing) return existing;
    const id = crypto.randomUUID().replaceAll('-', '');
    localStorage.setItem('diagnosticDeviceId', id);
    return id;
};

const blockedKey = /authorization|cookie|password|pin|qr|token|dsn|secret|phone|email|photo|name/i;
const allowedDetailKeys = new Set([
    'app_version',
    'schema_version',
    'dexie_schema_version',
    'stage',
    'duration_ms',
    'pending_count',
    'oldest_pending_age_seconds',
    'category',
    'permission',
    'state',
    'online',
    'reachable',
    'secure_context',
    'clock_skew_seconds',
    'queue_size',
    'status_code',
    'cache_version',
    'index'
]);
const blockedValue = [
    /\b(Bearer|K-PIN-CODE|V-TOKEN)\s+[^\s,;]+/gi,
    /\b(authorization|cookie|password|pin|qr|token|dsn|secret|phone|email)\s*[:=]\s*[^\s,;&]+/gi,
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    /(^|[^\w-])(?:\+\d[\d ()-]{8,}\d|\d[\d ()]{8,}\d)(?=[^\w-]|$)/g
];

const reportUploadState = (state: 'ok' | 'failed'): void => {
    if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
        window.dispatchEvent(new CustomEvent('feed:diagnostics-upload', { detail: state }));
    }
};

export const sanitizeDiagnosticValue = (value: unknown, key = ''): unknown => {
    if (blockedKey.test(key)) return '[REDACTED]';
    if (Array.isArray(value)) return value.map((item) => sanitizeDiagnosticValue(item));
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
                .slice(0, 20)
                .map(([childKey, child]) => [childKey, sanitizeDiagnosticValue(child, childKey)])
        );
    }
    if (typeof value === 'string') {
        return blockedValue.reduce((result, pattern) => result.replace(pattern, '[REDACTED]'), value).slice(0, 500);
    }
    return value;
};

const safeDetails = (details: Record<string, unknown>): Record<string, unknown> =>
    sanitizeDiagnosticValue(
        Object.fromEntries(Object.entries(details).filter(([key]) => allowedDetailKeys.has(key)))
    ) as Record<string, unknown>;

export const recordDiagnostic = async (
    eventType: string,
    details: Record<string, unknown> = {},
    state: DiagnosticEvent['state'] = 'ok'
): Promise<void> => {
    try {
        const now = Date.now();
        const dedupeKey = `${eventType}:${state}:${JSON.stringify(safeDetails(details))}`.slice(0, 250);
        const duplicate = await db.diagnostics.where('dedupe_key').equals(dedupeKey).first();
        if (duplicate && now - new Date(duplicate.occurred_at).getTime() < 60_000) return;
        await db.diagnostics.add({
            event_id: ulid(),
            event_type: eventType,
            occurred_at: new Date(now).toISOString(),
            state,
            details: safeDetails(details),
            attempts: 0,
            next_attempt_at: now,
            expires_at: now + TTL_MS,
            dedupe_key: dedupeKey
        });
        await db.diagnostics.where('expires_at').below(now).delete();
        const overflow = (await db.diagnostics.count()) - MAX_EVENTS;
        if (overflow > 0) {
            const oldest = await db.diagnostics.orderBy('expires_at').limit(overflow).primaryKeys();
            await db.diagnostics.bulkDelete(oldest);
        }
    } catch {
        // Diagnostics must never affect feeding.
    }
};

export const uploadDiagnostics = async (): Promise<void> => {
    if (uploading || !navigator.onLine || !localStorage.getItem('pin')) return;
    uploading = true;
    try {
        const now = Date.now();
        const events = await db.diagnostics.where('next_attempt_at').belowOrEqual(now).limit(50).toArray();
        if (!events.length) return;
        await axios.post(
            `${API_DOMAIN}/client-diagnostics`,
            {
                device_id: getDeviceId(),
                app_version: APP_VERSION,
                events: events.map(({ event_id, event_type, occurred_at, state, details }) => ({
                    event_id,
                    event_type,
                    occurred_at,
                    state,
                    details
                }))
            },
            { headers: { Authorization: `K-PIN-CODE ${localStorage.getItem('pin')}` } }
        );
        await db.diagnostics.bulkDelete(events.map(({ event_id }) => event_id));
        reportUploadState('ok');
    } catch {
        reportUploadState('failed');
        const now = Date.now();
        const events = await db.diagnostics.where('next_attempt_at').belowOrEqual(now).limit(50).toArray();
        await db.diagnostics.bulkPut(
            events.map((event) => ({
                ...event,
                attempts: event.attempts + 1,
                next_attempt_at: now + Math.min(300_000, 2 ** Math.min(event.attempts, 8) * 1000)
            }))
        );
    } finally {
        uploading = false;
    }
};

export const initializeDiagnostics = (): void => {
    axios.defaults.timeout = 15_000;
    axios.interceptors.request.use((config) => {
        config.headers.set('App-Version', APP_VERSION);
        config.headers.set('X-Device-ID', getDeviceId());
        config.headers.set('X-Request-ID', crypto.randomUUID());
        const kitchenId = localStorage.getItem('kitchenId');
        if (kitchenId) config.headers.set('X-Kitchen-ID', kitchenId);
        return config;
    });
    void recordDiagnostic('app_start', {
        app_version: APP_VERSION,
        dexie_schema_version: 23,
        secure_context: isSecureContext
    });
    window.addEventListener('online', () => {
        void recordDiagnostic('online');
        void uploadDiagnostics();
    });
    window.addEventListener('offline', () => {
        void recordDiagnostic('offline', {}, 'degraded');
    });
    window.addEventListener(
        'error',
        (event) => void recordDiagnostic('unhandled_error', { category: event.error?.name }, 'critical')
    );
    window.addEventListener(
        'unhandledrejection',
        (event) =>
            void recordDiagnostic(
                'unhandled_error',
                {
                    category: event.reason instanceof Error ? event.reason.name : 'PromiseRejection'
                },
                'critical'
            )
    );
    window.setInterval(() => void uploadDiagnostics(), 30_000);
};
