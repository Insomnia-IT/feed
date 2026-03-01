import { createContext, type ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';

import type { GroupBadge, Transaction, Volunteer } from 'db';
import { db } from 'db';
import { getTodayStart, getVolTransactionsAsync } from 'components/post-scan/post-scan.utils';

interface IScanContext {
    qrcode: string;
    view: MainViewTypes;
    errorMessage: string;
    handleScan: (qrcode: string) => void;
    vol?: Volunteer | null;
    volTransactions?: Array<Transaction> | null;
    groupBadge?: GroupBadge | null;
    handleCloseCard: () => void;
}

type MainViewTypes = 'scan' | 'loading' | 'error' | 'post-scan' | 'post-scan-group-badge';
export const postScanStatuses = ['anon', 'vol-warning', 'vol-error', 'child', 'group-badge'];

const ScanContext = createContext<IScanContext | null>(null);

const DOUBLE_SCAN_TIMEOUT = 5000;

export const ScanProvider = ({ children }: { children: ReactNode }) => {
    /** View */
    const [view, setView] = useState<MainViewTypes>('scan');

    /** PostScan Payload */
    const [vol, setVol] = useState<null | Volunteer>();
    const [volTransactions, setVolTransactions] = useState<null | Array<Transaction>>();
    const [qrcode, setQrcode] = useState<string>('');
    const [groupBadge, setGroupBadge] = useState<null | GroupBadge>();
    const [errorMessage, setErrorMessage] = useState<string>('');
    const reset = () => {
        setView('scan');
        setVol(null);
        setGroupBadge(null);
        setErrorMessage('');
        setQrcode('');
        setVolTransactions(null);
    };

    const isScanRef = useRef(false);
    const handleScan = useCallback(async (qrcode: string) => {
        if (isScanRef.current) {
            return;
        }

        isScanRef.current = true;

        try {
            setQrcode(qrcode);
            const vol = await db.volunteers.where('qr').equals(qrcode).first();
            setVol(vol);
            const lastTransction = await db.transactions.reverse().limit(1).first();
            if (
                vol &&
                lastTransction &&
                lastTransction.vol_id === vol.id &&
                new Date(lastTransction.ts * 1000 + DOUBLE_SCAN_TIMEOUT) > new Date()
            ) {
                return;
            }
            const groupBadge = await db.groupBadges.where('qr').equals(qrcode).first();
            setGroupBadge(groupBadge);
            if (vol) {
                const volTransactions = await getVolTransactionsAsync(vol, getTodayStart());
                setVolTransactions(volTransactions);
            }

            if (qrcode === 'anon' || vol) {
                setView('post-scan');
                return;
            }

            if (groupBadge) {
                setView('post-scan-group-badge');
                return;
            }

            setView('error');
            setErrorMessage('Бейдж не найден');
        } finally {
            isScanRef.current = false;
        }
    }, []);

    const viewContextValue: IScanContext = useMemo(
        () => ({
            qrcode,
            view,
            errorMessage,
            handleScan,
            vol,
            volTransactions,
            groupBadge,
            handleCloseCard: () => {
                reset();
            }
        }),
        [qrcode, view, errorMessage, handleScan, vol, groupBadge]
    );
    return <ScanContext.Provider value={viewContextValue}>{children}</ScanContext.Provider>;
};

export function useScan(): IScanContext {
    const context = useContext(ScanContext);
    if (context === null) {
        throw new Error('useScan must be used within a ScanProvider');
    }
    return context;
}
