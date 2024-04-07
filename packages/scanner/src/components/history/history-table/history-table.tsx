import React from 'react';
import dayjs from 'dayjs';

import type { TransactionJoined } from '~/db';

import style from './history-table.module.css';

interface HistoryListProps {
    transactions: Array<TransactionJoined>;
}

export const HistoryTable = React.memo(function HistoryTable({ transactions }: HistoryListProps) {
    const txItems = transactions.map((transaction, index) => {
        return (
            <tr key={index}>
                <td>{transaction.vol ? transaction.vol.name : 'Аноним'}</td>
                <td>{transaction.is_vegan ? 'Веган' : 'Мясоед'}</td>
                <td>{dayjs.unix(transaction.ts).format('YYYY.MM.DD HH:mm:ss').toString()}</td>
            </tr>
        );
    });

    return (
        <table className={style.table}>
            <thead>
                <tr>
                    <th scope='col'>Волонтер</th>
                    <th scope='col'>Тип</th>
                    <th scope='col'>Время</th>
                </tr>
            </thead>
            <tbody>{txItems}</tbody>
        </table>
    );
});
