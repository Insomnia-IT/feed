import { Form, Tabs } from 'antd';
import { type ReactNode, useCallback, useMemo } from 'react';
import { useLocation, useParams } from 'react-router';

import { useScreen } from 'shared/providers';
import { CommonEdit } from './common-edit/common-edit';
import CommonFood from './common-food/common-food';
import { CommonHistory } from './common-history/common-history';
import { InventorySection } from './common-edit/sections';
import styles from './common.module.css';
import Connections from './connections/connections';
import { VolTabPaneScroll } from './vol-tab-pane-scroll';

interface IProps {
    activeKey: string;
    setActiveKey: (key: string) => void;
}

const CreateEdit = ({ activeKey, setActiveKey }: IProps) => {
    const { isDesktop } = useScreen();
    const useSwipeableTabs = !isDesktop;
    const form = Form.useFormInstance();
    const { id: routeVolunteerId } = useParams<{ id: string }>();
    const { pathname } = useLocation();
    const isCreationProcess = pathname.includes('create');
    const volunteerId = routeVolunteerId ?? form.getFieldValue('id');
    const volunteerIdNumber = volunteerId ? Number(volunteerId) : undefined;
    const volunteerName = Form.useWatch('name', form);
    const shouldAddMobileBottomOffset = !isDesktop && activeKey !== '1';

    const wrapTabPane = useCallback((content: ReactNode) => <VolTabPaneScroll>{content}</VolTabPaneScroll>, []);

    const items = useMemo(() => {
        const tabs = [
            {
                key: '1',
                label: isDesktop ? 'Основное' : 'Инфо',
                children: wrapTabPane(<CommonEdit />)
            },
            {
                key: '2',
                label: 'Связи',
                children: wrapTabPane(<Connections />)
            },
            {
                key: '3',
                label: 'Питание',
                children: wrapTabPane(<CommonFood />)
            }
        ];

        if (!isCreationProcess) {
            tabs.push(
                {
                    key: '4',
                    label: 'Инвентарь',
                    children: wrapTabPane(
                        <InventorySection
                            volunteerId={volunteerIdNumber}
                            volunteerName={volunteerName}
                            isCreationProcess={isCreationProcess}
                        />
                    )
                },
                {
                    key: '5',
                    label: isDesktop ? 'История изменений' : 'Изменения',
                    children: wrapTabPane(<CommonHistory role="volunteer" />)
                },
                {
                    key: '6',
                    label: isDesktop ? 'История действий' : 'Ист. действий',
                    children: wrapTabPane(<CommonHistory role="actor" />)
                }
            );
        }

        return tabs;
    }, [isCreationProcess, isDesktop, volunteerIdNumber, volunteerName, wrapTabPane]);

    return (
        <div
            className={[
                styles.volFormTabs,
                useSwipeableTabs ? styles.volFormTabsMobile : '',
                shouldAddMobileBottomOffset ? styles.mobileTabsWithOffset : ''
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <Tabs activeKey={activeKey} onChange={setActiveKey} size={isDesktop ? 'middle' : 'small'} items={items} />
        </div>
    );
};

export default CreateEdit;
