import React, { memo } from 'react';
import dayjs from 'dayjs';

import { Text } from '~/shared/ui/typography';
import type { TransactionJoined } from '~/db';
import { Cell, HeadCell, Row, Table, TBody, THead } from '~/shared/ui/table';

import css from './history-table.module.css';

interface HistoryListProps {
    transactions: Array<TransactionJoined>;
}
export const HistoryTable = memo(function HistoryTable({ transactions }: HistoryListProps) {
    return (
        <div className={css.historyTable}>
            <Text>
                <span className={css.meat}>🥩 Мясоеды</span> / <span className={css.vegan}>🥦 Веганы</span>
            </Text>
            <Table className={css.table}>
                <THead>
                    <Row>
                        <HeadCell className={css.first} scope='col'>
                            Волонтер
                        </HeadCell>
                        <HeadCell scope='col'>Тип</HeadCell>
                        <HeadCell scope='col'>Время</HeadCell>
                    </Row>
                </THead>
                <TBody>
                    {transactions.map((transaction, index) => (
                        <Row key={index}>
                            <Cell className={css.first}>{transaction.vol ? transaction.vol.name : 'Аноним'}</Cell>
                            <Cell>{transaction.is_vegan ? '🥦' : '🥩'}</Cell>
                            <Cell>{dayjs.unix(transaction.ts).format('mm:ss').toString()}</Cell>
                        </Row>
                    ))}
                </TBody>
            </Table>
        </div>
    );
});
