import type { MouseEvent, ReactNode } from 'react';

import styles from './mass-edit.module.css';

export const SelectionCell = ({
    children,
    onMouseDown,
    onMouseEnter
}: {
    children: ReactNode;
    onMouseDown: (event: MouseEvent<HTMLDivElement>) => void;
    onMouseEnter: (event: MouseEvent<HTMLDivElement>) => void;
}) => (
    <div className={styles.selectionCellHitTarget} onMouseDown={onMouseDown} onMouseEnter={onMouseEnter}>
        {children}
    </div>
);
