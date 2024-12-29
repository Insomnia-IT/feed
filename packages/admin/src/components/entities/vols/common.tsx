import { type FormInstance, Tabs } from '@pankod/refine-antd';
import { useEffect, useState } from 'react';

import { CommonEdit } from './common-edit';
import { CommonFoodTest } from './common-food';
import { CommonHistory } from './common-history';

export const CreateEdit = ({ form }: { form: FormInstance }) => {
    const [screenSize, setScreenSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    useEffect(() => {
        const handleResize = () => {
            setScreenSize({ width: window.innerWidth, height: window.innerHeight });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const antCardBody = document.querySelector('.ant-card-body') as HTMLElement;
        const saveButton = document.querySelector('.ant-card-actions') as HTMLElement;
        saveButton.style.margin = '0 24px';
        if (screenSize.width <= 576) {
            antCardBody.style.padding = '5px';
            saveButton.style.margin = '0px 8px 56px 5px';
            saveButton.style.position = 'sticky';
            saveButton.style.bottom = '50px';
        }
    });

    useEffect(() => {
        const updateReturnButtons = document.querySelector('.ant-page-header-heading-extra ');
        updateReturnButtons?.remove();
    });

    const items = [
        {
            key: '1',
            label: screenSize.width <= 576 ? 'Инфо' : 'Персональная информация',
            children: <CommonEdit form={form} />
        },
        {
            key: '2',
            label: 'Питание',
            children: <CommonFoodTest />
        },
        {
            key: '3',
            label: 'История действий',
            children: <CommonHistory />
        }
    ];
    return <Tabs defaultActiveKey="1" items={items} />;
};
