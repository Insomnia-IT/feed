import type { TransactionJoined } from 'db';
import type { FeedStats } from './use-local-stats';

export interface LocalStatsHook {
    error: string | null;
    progress: boolean;
    updated: boolean;
    stats: FeedStats | null;
    update: (string: string, boolean?: boolean) => Promise<void>;
}

export interface LocalLastTransHook {
    error: string | null;
    progress: boolean;
    transactions: Array<TransactionJoined>;
    update: (limit: number) => Promise<{ txs: Array<TransactionJoined>; total: number }>;
}
