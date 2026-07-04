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
                <Text>
                    <span className={css.meat}>{item.planMeat}</span> /{' '}
                    <span className={css.vegan}>{item.planVegan}</span>
                </Text>
            </HeadCell>
            <HeadCell>
                <Text>
                    <span className={css.meat}>{item.factMeat}</span> /{' '}
                    <span className={css.vegan}>{item.factVegan}</span>
                </Text>
            </HeadCell>
        </Row>
    ));

    const totalPlanMeat = stats.reduce((sum, item) => sum + item.planMeat, 0);
    const totalPlanVegan = stats.reduce((sum, item) => sum + item.planVegan, 0);
    const totalFactMeat = stats.reduce((sum, item) => sum + item.factMeat, 0);
    const totalFactVegan = stats.reduce((sum, item) => sum + item.factVegan, 0);

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
                <TBody>
                    {rows}
                    <Row className={css.totalRow}>
                        <HeadCell scope="row">
                            <Text>Итого</Text>
                        </HeadCell>
                        <HeadCell>
                            <Text>-</Text>
                        </HeadCell>
                        <HeadCell>
                            <Text>
                                <span className={css.meat}>{totalPlanMeat}</span> /{' '}
                                <span className={css.vegan}>{totalPlanVegan}</span>
                            </Text>
                        </HeadCell>
                        <HeadCell>
                            <Text>
                                <span className={css.meat}>{totalFactMeat}</span> /{' '}
                                <span className={css.vegan}>{totalFactVegan}</span>
                            </Text>
                        </HeadCell>
                    </Row>
                </TBody>
            </Table>
        </div>
    );
};
