import { Tabs, Grid } from 'antd';
import { useMemo, useState, useEffect } from 'react';

import { CommonEdit } from './common-edit/common-edit';
import CommonFood from './common-food/common-food';
import { CommonHistory } from './common-history/common-history';

const { useBreakpoint } = Grid;

const CreateEdit = () => {
    const screens = useBreakpoint();
    const isMobile = screens.xs;

    const [activeKey, setActiveKey] = useState('1');

    useEffect(() => {
        document.querySelector('.ant-page-header-heading-extra')?.remove();
    }, []);

    const items = useMemo(
        () => [
            {
                key: '1',
                label: isMobile ? 'Инфо' : 'Основное',
                children: <CommonEdit />
            },
            {
                key: '2',
                label: 'Питание',
                children: <CommonFood />
            },
            {
                key: '3',
                label: 'История действий',
                children: <CommonHistory role="volunteer" />
            },
            {
                key: '4',
                label: 'История волонтёра',
                children: <CommonHistory role="actor" />
            }
        ],
        [isMobile]
    );

    return (
        <Tabs
            activeKey={activeKey}
            onChange={setActiveKey}
            size={isMobile ? 'small' : 'middle'}
            tabBarGutter={isMobile ? 6 : 16}
            items={items}
        />
    );
};

export default CreateEdit;
