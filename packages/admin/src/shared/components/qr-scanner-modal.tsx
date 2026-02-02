import { Form, Modal } from 'antd';

import { type ChangeEvent, useState } from 'react';
import { QrScannerComponent, useScannerController } from '../components/qr-scanner-component';

export const QRScannerModal = ({
    open,
    onClose,
    handleQRChange
}: {
    open: boolean;
    onClose: () => void;
    handleQRChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}) => {
    const [isModalOpened, setIsModalOpened] = useState(false);

    const form = Form.useFormInstance();

    const closeModal = () => {
        setIsModalOpened(false);
        onClose();
    };

    const scannerController = useScannerController({
        onScan: async (qr: string) => {
            if (qr) {
                form.setFieldValue('qr', qr.replace(/[^A-Za-z0-9]/g, ''));
                closeModal();
                handleQRChange?.({ target: { value: qr } } as ChangeEvent<HTMLInputElement>);
            }
        }
    });

    return (
        open && (
            <Modal
                title="Отсканируй новый бейдж"
                open
                footer={null}
                onCancel={closeModal}
                afterOpenChange={setIsModalOpened}
            >
                {isModalOpened && <QrScannerComponent scannerController={scannerController} />}
            </Modal>
        )
    );
};
