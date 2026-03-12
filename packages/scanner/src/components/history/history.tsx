import { useEffect, useRef, useState } from 'react';

import { HistoryTable } from 'components/history/history-table';
import { useLocalLastTrans } from 'request-local-db/use-local-last-trans';
import { StatsBlock } from 'components/history/stats-block/stats-block';

import css from './history.module.css';

export const History = () => {
    const [limit, setLimit] = useState<number>(20);
    const [end, setEnd] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const { error, progress, transactions, update } = useLocalLastTrans();

    const tableRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const table = tableRef.current;
        if (!table) return;

        const handleScroll = (): void => {
            const { clientHeight, scrollHeight, scrollTop } = table;
            if (scrollTop + clientHeight >= scrollHeight - 5 && !loading && !end) {
                setLimit((prevLimit) => prevLimit + 20);
            }
        };

        table.addEventListener('scroll', handleScroll);
        return () => {
            table.removeEventListener('scroll', handleScroll);
        };
    }, [end, loading]);

    useEffect(() => {
        const loadTxs = async () => {
            setLoading(true);
            const { total, txs } = await update(limit);
            if (txs.length >= total) {
                setEnd(true);
            }
            setLoading(false);
        };
        void loadTxs();
    }, [limit, update]);

    return (
        <div className={css.history} ref={tableRef}>
            {transactions && !error && (
                <>
                    <StatsBlock />
                    <HistoryTable transactions={transactions} />
                </>
            )}
            {progress && <div>Загрузка...</div>}
            {error && <div>Что-то пошло не так</div>}
        </div>
    );
};
