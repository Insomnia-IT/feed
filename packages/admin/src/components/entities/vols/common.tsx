import { type FormInstance, Tabs } from '@pankod/refine-antd';

import { CommonEdit } from './common-edit';
import { CommonFoodTest } from './common-food';
import { useEffect, useState } from 'react';

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
        if (screenSize.width <= 576) {
            antCardBody.style.padding = '5px';
        }
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
            children: 'История действий'
        }
    ];
    return <Tabs defaultActiveKey='1' items={items} />;
};
