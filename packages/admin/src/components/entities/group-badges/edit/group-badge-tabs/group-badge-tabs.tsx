import { Tabs } from 'antd';
import { useMemo } from 'react';
import type { BaseKey } from '@refinedev/core';

import { useScreen } from 'shared/providers';
import { CreateEdit } from '../../common';
import { GroupMealPlan } from '../../group-meal-plan/group-meal-plan';
import { GroupBadgePlanning } from '../../planning/group-badge-planning';
import { VolunteersTab } from '../volunteers-tab/volunteers-tab';
import styles from './group-badge-tabs.module.css';

interface GroupBadgeTabsProps {
    activeKey: string;
    groupBadgeId?: BaseKey;
    onChange: (key: string) => void;
}

export const GroupBadgeTabs = ({ activeKey, groupBadgeId, onChange }: GroupBadgeTabsProps) => {
    const { isDesktop } = useScreen();
    const numericGroupBadgeId = Number(groupBadgeId);
    const shouldAddMobileBottomOffset = !isDesktop && activeKey !== '1';

    const items = useMemo(
        () => [
            {
                key: '1',
                label: 'Основное',
                children: <CreateEdit />
            },
            {
                key: '2',
                label: 'Волонтеры',
                children: <VolunteersTab groupBadgeId={numericGroupBadgeId} />
            },
            {
                key: '3',
                label: 'Питание',
                children: (
                    <>
                        <GroupBadgePlanning groupBadgeId={numericGroupBadgeId} />
                        <GroupMealPlan id={groupBadgeId} />
                    </>
                )
            }
        ],
        [groupBadgeId, numericGroupBadgeId]
    );

    return (
        <div className={shouldAddMobileBottomOffset ? styles.tabsWithMobileOffset : undefined}>
            <Tabs activeKey={activeKey} onChange={onChange} size={isDesktop ? 'middle' : 'small'} items={items} />
        </div>
    );
};
