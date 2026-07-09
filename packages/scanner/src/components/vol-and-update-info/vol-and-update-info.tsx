import cn from 'classnames';

import css from './vol-and-update-info.module.css';
import { ScanScreenStats } from '../scan-screen-stats';

export const VolAndUpdateInfo = ({ textColor = 'black' }: { textColor?: 'black' | 'white' }) => {
    return (
        <div className={cn(css.postScanStats, { [css[textColor]]: textColor })}>
            <ScanScreenStats isAfterScan />
        </div>
    );
};
