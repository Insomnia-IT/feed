import React from 'react';

import styles from './color-circle.module.css';

export type ColorDef = string | { fill: string; border: string };

export const ColorCircle: React.FC<{ def: ColorDef }> = ({ def }) =>
    typeof def === 'string' ? (
        <span className={styles.badgeColorCircle} style={{ backgroundColor: def }} />
    ) : (
        <span
            className={styles.badgeColorCircle}
            style={{
                backgroundColor: def.fill,
                boxShadow: `0 0 0 2px ${def.border}`
            }}
        />
    );
