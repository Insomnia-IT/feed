import type { TransactionJoined } from 'db';
import { FeedStats } from './use-local-stats';

export interface LocalStatsHook {
    error: any;
    progress: boolean;
    updated: boolean;
    stats: FeedStats | null;
    update: (string: string, boolean?: boolean) => Promise<any>;
}

export interface LocalLastTransHook {
    error: any;
    progress: boolean;
    transactions: Array<TransactionJoined>;
    update: (limit: number) => Promise<any>;
}
