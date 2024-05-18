import { memo } from 'react';

import { Alert } from '~/shared/ui/alert';
import { useScan } from '~/model/scan-provider/scan-provider';

import css from './scan-status.module.css';

export const ScanStatus = memo(function ScanStatus(props) {
    // const { alertActive, alertText } = useScan();

    return (
        <>
            {/*<div className={css.scanStatus}>*/}
            {/*    {alertActive && <Alert text={alertText} withAction textAction='Отмена' />}*/}
            {/*</div>*/}
        </>
    );
});
