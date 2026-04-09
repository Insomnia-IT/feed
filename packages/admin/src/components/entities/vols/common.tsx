import { Tabs } from 'antd';
import { useMemo } from 'react';

import { useScreen } from 'shared/providers';
import { CommonEdit } from './common-edit/common-edit';
import CommonFood from './common-food/common-food';
import { CommonHistory } from './common-history/common-history';
import styles from './common.module.css';

interface IProps {
    activeKey: string;
    setActiveKey: (key: string) => void;
}

const CreateEdit = ({ activeKey, setActiveKey }: IProps) => {
    const { isDesktop } = useScreen();
    const shouldAddMobileBottomOffset = !isDesktop && activeKey !== '1';

    const items = useMemo(
        () => [
            {
                key: '1',
                label: isDesktop ? 'Основное' : 'Инфо',
                children: <CommonEdit />
            },
            {
                key: '2',
                label: 'Питание',
                children: <CommonFood />
            },
            {
                key: '3',
                label: isDesktop ? 'История действий' : 'Действия',
                children: <CommonHistory role="volunteer" />
            },
            {
                key: '4',
                label: isDesktop ? 'История волонтёра' : 'История',
                children: <CommonHistory role="actor" />
            }
        ],
        [isDesktop]
    );

    return (
        <div className={shouldAddMobileBottomOffset ? styles.mobileTabsWithOffset : undefined}>
            <Tabs activeKey={activeKey} onChange={setActiveKey} size={isDesktop ? 'middle' : 'small'} items={items} />
        </div>
    );
};

export default CreateEdit;
