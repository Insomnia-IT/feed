import React, { memo } from 'react';
import dayjs from 'dayjs';
import { WarningFilled } from '@ant-design/icons';

import { Text } from '~/shared/ui/typography';
import type { TransactionJoined } from '~/db';
import { Cell, HeadCell, Row, Table, TBody, THead } from '~/shared/ui/table';
import { mealTimes } from '~/shared/lib/utils';

import css from './history-table.module.css';

const formatDate = (ts: number): string => {
    if (dayjs().startOf('day') > dayjs.unix(ts)) {
        return dayjs.unix(ts).format('dd HH:mm').toString();
    } else {
        return dayjs.unix(ts).format('HH:mm').toString();
    }
};

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
                        <HeadCell scope='col'>Приём пищи</HeadCell>
                        <HeadCell scope='col'>Кол-во</HeadCell>
                        <HeadCell scope='col'>Тип</HeadCell>
                        <HeadCell scope='col'>Время</HeadCell>
                    </Row>
                </THead>
                <TBody>
                    {transactions.map((transaction, index) => (
                        <Row key={index}>
                            <Cell className={css.first}>
                                {!transaction.amount && (
                                    <>
                                        <WarningFilled style={{ color: 'red' }} />{' '}
                                    </>
                                )}
                                {transaction.vol ? transaction.vol.name : 'Аноним'}
                            </Cell>
                            <Cell>{mealTimes[transaction.mealTime]}</Cell>
                            <Cell>{transaction.amount}</Cell>
                            <Cell>{transaction.is_vegan ? '🥦' : '🥩'}</Cell>
                            <Cell>{formatDate(transaction.ts)}</Cell>
                        </Row>
                    ))}
                </TBody>
            </Table>
        </div>
    );
});
