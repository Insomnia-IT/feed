import { useState, useEffect, useRef } from 'react';
import { useSelect as useSelectAntd } from '@refinedev/antd';
import { Form, notification, type FormInstance } from 'antd';
import type { VolEntity } from 'interfaces';
import { useSearchVolunteer } from 'shared/hooks';
import { formatVolunteerLabel } from 'shared/utils/format-volunteer-label';

export const useStorageQrScanner = () => {
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [currentForm, setCurrentForm] = useState<FormInstance | null>(null);
    const [scannedQr, setScannedQr] = useState<string | undefined>();
    const processedQrRef = useRef<string | undefined>(undefined);

    const { data: scannedVolunteer, isLoading: isVolunteerLoading } = useSearchVolunteer(scannedQr);

    useEffect(() => {
        if (scannedQr && scannedVolunteer && currentForm && processedQrRef.current !== scannedQr) {
            processedQrRef.current = scannedQr;
            currentForm.setFieldValue('volunteer', scannedVolunteer.id);
            notification.success({ message: `Волонтер найден: ${scannedVolunteer.name}` });
        }
    }, [scannedQr, scannedVolunteer, currentForm]);

    const { selectProps: volunteerSelectProps } = useSelectAntd<VolEntity>({
        resource: 'volunteers',
        optionLabel: formatVolunteerLabel,
        onSearch: (value) => [
            {
                field: 'search',
                operator: 'eq',
                value: value
            }
        ],
        defaultValue: scannedVolunteer?.id
    });

    const handleOpenQrScanner = (form: FormInstance) => {
        setCurrentForm(form);
        processedQrRef.current = undefined;
        setScannedQr(undefined);
        setIsQrModalOpen(true);
    };

    const handleQrScan = (qr: string) => {
        setScannedQr(qr);
        setIsQrModalOpen(false);
    };

    const handleCloseQrScanner = () => {
        setIsQrModalOpen(false);
    };

    const [actionForm] = Form.useForm();

    return {
        isQrModalOpen,
        setIsQrModalOpen,
        currentForm,
        setCurrentForm,
        scannedQr,
        setScannedQr,
        scannedVolunteer,
        isVolunteerLoading,
        volunteerSelectProps,
        handleOpenQrScanner,
        handleQrScan,
        handleCloseQrScanner,
        actionForm
    };
};
