import { useMemo } from 'react';
import cn from 'classnames';

import { Text } from 'shared/ui/typography';
import { TableType } from 'components/stats';
import type { FeedStats } from 'request-local-db';
import { MEAL_TIME } from 'request-local-db';
import { HeadCell, Row, Table, TBody, THead } from 'shared/ui/table';

import css from './stats-table.module.css';

interface StatsTableProps {
    stats: FeedStats;
    tableType: TableType;
    progress: boolean;
}

const MEAL_TIME_LABEL: Record<string, string> = {
    breakfast: 'Завтрак',
    lunch: 'Обед',
    dinner: 'Ужин',
    night: 'Дожор'
};

export const StatsTable = ({ progress, stats, tableType }: StatsTableProps) => {
    const { feedCount, onField } = stats;

    const rows = useMemo(() => {
        return MEAL_TIME.map((MT) => {
            const formattedMealTime = MEAL_TIME_LABEL[MT] ?? '';

            return (
                <Row key={MT} className={css.contentRow}>
                    <HeadCell scope="row">{formattedMealTime}</HeadCell>
                    <HeadCell>
                        <Text>{feedCount[MT]?.total || '-'}</Text>
                        <Text>
                            <span className={css.meat}>{feedCount[MT]?.NT1 || '-'}</span>/
                            <span className={css.vegan}>{feedCount[MT]?.NT2 || '-'}</span>
                        </Text>
                    </HeadCell>
                    <HeadCell>
                        <Text>{onField[MT]?.total || '-'}</Text>
                        <Text>
                            <span className={css.meat}>{onField[MT]?.NT1 || '-'}</span>/
                            <span className={css.vegan}>{onField[MT]?.NT2 || '-'}</span>
                        </Text>
                    </HeadCell>
                </Row>
            );
        });
    }, [feedCount, onField]);

    return (
        <div className={css.tableWrapper}>
            <Table className={cn(css.table, { [css.loading]: progress })}>
                <THead>
                    <Row>
                        <HeadCell />
                        <HeadCell scope="col">{tableType === TableType.default ? 'Факт' : 'Прогноз'}</HeadCell>
                        <HeadCell scope="col">На поле</HeadCell>
                    </Row>
                </THead>
                <TBody>{rows}</TBody>
            </Table>
            <div className={css.info}>
                <Text>
                    <span className={css.meat}>🥩 Мясоеды </span> / <span className={css.vegan}>🥦 Веганы</span>
                </Text>
            </div>
        </div>
    );
};
