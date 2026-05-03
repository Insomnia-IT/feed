import type { ReactNode } from 'react';

export type HistoryFieldEntry = {
    key: string;
    label: string;
    oldValue: ReactNode;
    newValue: ReactNode;
};

export type HistoryViewModel = {
    key: string;
    actorLabel: string;
    actorRouteId?: number;
    actionAt: string;
    statusLabel: string;
    titleAddition?: string;
    fields: HistoryFieldEntry[];
    groupOperationUuid?: string;
};
