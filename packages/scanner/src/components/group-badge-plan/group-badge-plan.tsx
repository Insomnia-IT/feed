import { GroupBadgePlanTable } from './group-badge-plan-table';
import { useGroupBadgePlanStats } from 'shared/hooks/use-group-badge-plan-stats';

import css from './group-badge-plan.module.css';

export const GroupBadgePlan = () => {
    const { stats } = useGroupBadgePlanStats();

    return (
        <div className={css.groupBadgePlan}>
            <GroupBadgePlanTable stats={stats} />
        </div>
    );
};
