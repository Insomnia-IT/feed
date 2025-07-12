import { useState } from 'react';
import { FormInstance } from 'antd';

import { dataProvider } from 'dataProvider';
import { VolEntity } from 'interfaces';

export const useQrDuplicationCheck = (form: FormInstance) => {
    const [qrDuplicateVolunteer, setQrDuplicateVolunteer] = useState<VolEntity | null>(null);

    const checkQRDuplication = async (qrValue: string) => {
        if (!qrValue) return;
        const list = await dataProvider.getList<VolEntity>({
            filters: [{ field: 'qr', value: qrValue, operator: 'eq' }],
            resource: 'volunteers'
        });
        if (list.data.length && list.data[0].id !== form.getFieldValue('id')) {
            setQrDuplicateVolunteer(list.data[0]);
        }
    };

    const clearDuplicateQR = async () => {
        if (qrDuplicateVolunteer) {
            await dataProvider.update<VolEntity>({
                id: qrDuplicateVolunteer.id,
                resource: 'volunteers',
                variables: {
                    qr: null
                }
            });
            setQrDuplicateVolunteer(null);
        }
    };

    const handleDuplicateQRChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        if (value) void checkQRDuplication(value);
    };

    return {
        qrDuplicateVolunteer,
        setQrDuplicateVolunteer,
        handleDuplicateQRChange,
        clearDuplicateQR
    };
};
