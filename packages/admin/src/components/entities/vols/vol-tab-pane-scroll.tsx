import type { ReactNode } from 'react';

import styles from './vol-tab-pane-scroll.module.css';

export function VolTabPaneScroll({ children }: { children: ReactNode }) {
    return (
        <div className={`${styles.wrap} vol-tab-pane-scroll-wrap`}>
            <div className={styles.scroll}>{children}</div>
        </div>
    );
}
