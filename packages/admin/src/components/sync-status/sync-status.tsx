import { useQuery } from '@tanstack/react-query';
import { axios } from 'authProvider';
import { NEW_API_URL } from 'const';
import { formatInAppTimeZone } from 'shared/lib/dateHelper';

import styles from './sync-status.module.css';

interface SyncStatusData {
    lastSyncDate: string | null;
    isError: boolean;
}

function SyncStatus({ collapsed }: { collapsed?: boolean }) {
    const { data } = useQuery<SyncStatusData>({
        queryKey: ['sync-status'],
        queryFn: async () => {
            const res = await axios.get(`${NEW_API_URL}/sync-status`);
            return res.data;
        },
        refetchInterval: 30_000
    });

    if (collapsed) {
        if (!data) return null;
        return (
            <div className={styles.syncStatusCollapsed}>
                <span className={`${styles.dot} ${data.isError ? styles.dotError : styles.dotOk}`} />
            </div>
        );
    }

    return (
        <div className={styles.syncStatus}>
            <span className={styles.label}>Последняя синхронизация:</span>
            <span className={`${styles.date} ${data?.isError ? styles.dateError : ''}`}>
                {data?.lastSyncDate ? formatInAppTimeZone(data.lastSyncDate, 'DD.MM.YYYY HH:mm') : '—'}
            </span>
        </div>
    );
}

export default SyncStatus;
