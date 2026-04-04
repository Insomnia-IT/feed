import { Divider } from 'antd';
import { FC, useEffect, useRef } from 'react';

import { axios } from 'authProvider';
import { NEW_API_URL } from 'const';
import { useNavigate } from 'react-router-dom';

import { QrScannerComponent } from 'shared/components/qr-scanner-component';
import { useScannerController } from 'shared/components/qr-scanner-component/hooks/useScannerController';
import useVisibleDirections from 'components/entities/vols/use-visible-directions';
import type { VolEntity } from 'interfaces';

export const Dashboard: FC = () => {
    const navigate = useNavigate();

    const visibleDirectionsLocal = useVisibleDirections();
    const visibleDirectionsRef = useRef(visibleDirectionsLocal);

    useEffect(() => {
        visibleDirectionsRef.current = visibleDirectionsLocal;
    }, [visibleDirectionsLocal]);

    const scannerController = useScannerController({
        onScan: async (qr: string, { disableScan, enableScan }) => {
            disableScan();
            try {
                const { data } = await axios.get(`${NEW_API_URL}/volunteers/`, { params: { qr } });
                console.log('volunteers by qr', data);

                const volunteer = data.results[0] as VolEntity;

                const visibleDirections = visibleDirectionsRef.current;

                if (
                    !volunteer ||
                    (visibleDirections && !volunteer.directions?.some(({ id }) => visibleDirections.includes(id)))
                ) {
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
