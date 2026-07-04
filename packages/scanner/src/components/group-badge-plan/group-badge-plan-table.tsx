import { Text } from 'shared/ui/typography';
import { Table, TBody, THead, Row, HeadCell } from 'shared/ui/table';

import type { GroupBadgePlanStats } from 'shared/hooks/use-group-badge-plan-stats';

import css from './group-badge-plan-table.module.css';

interface GroupBadgePlanTableProps {
    stats: GroupBadgePlanStats[];
}

export const GroupBadgePlanTable = ({ stats }: GroupBadgePlanTableProps) => {
    const rows = stats.map((item) => (
        <Row key={item.id} className={css.contentRow}>
            <HeadCell scope="row">
                <Text>{item.name}</Text>
            </HeadCell>
            <HeadCell>
                <Text>{item.direction ?? '-'}</Text>
            </HeadCell>
            <HeadCell>
                <Text>{item.plan}</Text>
            </HeadCell>
            <HeadCell>
                <Text>{item.fact}</Text>
            </HeadCell>
        </Row>
    ));

    return (
        <div className={css.tableWrapper}>
            <Table className={css.table}>
                <THead>
                    <Row>
                        <HeadCell scope="col">Название</HeadCell>
                        <HeadCell scope="col">Служба</HeadCell>
                        <HeadCell scope="col">План</HeadCell>
                        <HeadCell scope="col">Факт</HeadCell>
                    </Row>
                </THead>
                <TBody>{rows}</TBody>
            </Table>
        </div>
    );
};
