import { Form, Tabs } from 'antd';
import { useMemo } from 'react';
import { useLocation, useParams } from 'react-router';

import { useScreen } from 'shared/providers';
import { CommonEdit } from './common-edit/common-edit';
import CommonFood from './common-food/common-food';
import { CommonHistory } from './common-history/common-history';
import { InventorySection } from './common-edit/sections';
import styles from './common.module.css';
import Connections from './connections/connections';

interface IProps {
    activeKey: string;
    setActiveKey: (key: string) => void;
}

const CreateEdit = ({ activeKey, setActiveKey }: IProps) => {
    const { isDesktop } = useScreen();
    const form = Form.useFormInstance();
    const { id: routeVolunteerId } = useParams<{ id: string }>();
    const { pathname } = useLocation();
    const isCreationProcess = pathname.includes('create');
    const volunteerId = routeVolunteerId ?? form.getFieldValue('id');
    const volunteerIdNumber = volunteerId ? Number(volunteerId) : undefined;
    const volunteerName = Form.useWatch('name', form);
    const shouldAddMobileBottomOffset = !isDesktop && activeKey !== '1';

    const items = useMemo(() => {
        const tabs = [
            {
                key: '1',
                label: isDesktop ? 'Основное' : 'Инфо',
                children: <CommonEdit />
            },
            {
                key: '2',
                label: 'Связи',
                children: <Connections />
            },
            {
                key: '3',
                label: 'Питание',
                children: <CommonFood />
            }
        ];

        if (!isCreationProcess) {
            tabs.push(
                {
                    key: '4',
                    label: 'Инвентарь',
                    children: (
                        <InventorySection
                            volunteerId={volunteerIdNumber}
                            volunteerName={volunteerName}
                            isCreationProcess={isCreationProcess}
                        />
                    )
                },
                {
                    key: '5',
                    label: isDesktop ? 'История изменений' : 'История',
                    children: <CommonHistory role="volunteer" />
                },
                {
                    key: '6',
                    label: isDesktop ? 'История действий' : 'Действия',
                    children: <CommonHistory role="actor" />
                }
            );
        }

        return tabs;
    }, [isCreationProcess, isDesktop, volunteerIdNumber, volunteerName]);

    return (
        <div className={`${styles.volFormTabs} ${shouldAddMobileBottomOffset ? styles.mobileTabsWithOffset : ''}`}>
            <Tabs activeKey={activeKey} onChange={setActiveKey} size={isDesktop ? 'middle' : 'small'} items={items} />
        </div>
    );
};

export default CreateEdit;
