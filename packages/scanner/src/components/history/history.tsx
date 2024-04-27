import React, { useContext, useEffect, useState } from 'react';

import { HistoryTable } from '~/components/history/history-table';
import { useLocalLastTrans } from '~/request-local-db/use-local-last-trans';
import { useView } from '~/model/view-provider/view-provider';

import style from './history.module.css';

export const History: React.FC = () => {
    const { currentView } = useView();
    const [limit, setLimit] = useState<number>(20);
    const [end, setEnd] = useState<boolean>(false);

    const { error, progress, transactions, update } = useLocalLastTrans();

    const tableRef = React.useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (currentView === 0) {
            tableRef.current?.scrollTo(0, 0);
            setEnd(false);
            setLimit(20);
        }
        if (currentView === 1) {
            void update(limit).then((txs) => {
                if (txs.length < limit) {
                    setEnd(true);
                }
            });
        }
    }, [limit, currentView, update]);

    const handleScroll = (): void => {
        if (tableRef.current) {
            const { clientHeight, scrollHeight, scrollTop } = tableRef.current;
            if (scrollTop + clientHeight === scrollHeight) {
                !end && setLimit((prevLimit) => prevLimit + 20);
            }
        }
    };

    return (
        <div className={style.history} ref={tableRef} onScroll={handleScroll}>
            {transactions && !error && <HistoryTable transactions={transactions} />}
            {progress && <div>Загрузка...</div>}
            {error && <div>Что-то пошло не так</div>}
        </div>
    );
};
