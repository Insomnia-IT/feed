import { type FormInstance, Tabs } from '@pankod/refine-antd';

import { CommonEdit } from './common-edit';
import { CommonFoodTest } from './common-food';

export const CreateEdit = ({ form }: { form: FormInstance }) => {
    const items = [
        {
            key: '1',
            label: 'Персональная информация',
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
