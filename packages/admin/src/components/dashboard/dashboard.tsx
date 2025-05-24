import { Divider } from 'antd';
import { FC } from 'react';

import { axios } from 'authProvider';
import { NEW_API_URL } from 'const';
import { useNavigate } from 'react-router-dom';

import { QrScannerComponent } from 'components/qr-scanner-component';
import { useScannerController } from 'components/qr-scanner-component/hooks/useScannerController';

export const Dashboard: FC = () => {
    const navigate = useNavigate();

    const scannerController = useScannerController({
        onScan: async (qr: string, { disableScan, enableScan }) => {
            disableScan();
            try {
                const { data } = await axios.get(`${NEW_API_URL}/volunteers/`, { params: { qr } });
                console.log('volunteers by qr', data);

                if (!data.results.length) {
                    alert('Волонтер не найден');
                } else {
                    navigate(`/volunteers/edit/${data.results[0].id}`);
                }
            } catch (e) {
                console.log(e);
                alert(`Ошибка поиска волонтера: ${e}`);
            } finally {
                enableScan();
            }
        }
    });

    return (
        <>
            <Divider orientation="center">ОТСКАНИРУЙ БЕЙДЖ</Divider>
            <QrScannerComponent scannerController={scannerController} />
        </>
    );
};
