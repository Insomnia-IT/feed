import React, { useEffect, useState } from 'react';

import { HistoryTable } from '~/components/history/history-table';
import { useLocalLastTrans } from '~/request-local-db/use-local-last-trans';
import { AppViews, useView } from '~/model/view-provider/view-provider';
import { StatsBlock } from '~/components/history/stats-block/stats-block';

import css from './history.module.css';

export const History: React.FC = () => {
    const { currentView } = useView();
    const [limit, setLimit] = useState<number>(20);
    const [end, setEnd] = useState<boolean>(false);

    const { error, progress, transactions, update } = useLocalLastTrans();

    console.log('transactions', transactions);

    const tableRef = React.useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const handleScroll = (): void => {
            if (tableRef.current) {
                const { clientHeight, scrollHeight, scrollTop } = tableRef.current;
                if (scrollTop + clientHeight === scrollHeight) {
                    !end && setLimit((prevLimit) => prevLimit + 20);
                }
            }
        };
        if (tableRef.current) {
            tableRef.current.addEventListener('scroll', handleScroll);
        }
        return () => {
            tableRef.current?.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        if (currentView !== AppViews.HISTORY) {
            tableRef.current?.scrollTo(0, 0);
            setEnd(false);
            setLimit(20);
        }
        if (currentView === AppViews.HISTORY) {
            void update(limit).then((txs) => {
                if (txs.length < limit) {
                    setEnd(true);
                }
            });
        }
    }, [limit, currentView, update]);

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
