import styles from './color-circle.module.css';

export type ColorDef = string | { fill: string; border: string };

export const ColorCircle = ({
    def,
    size = 12,
    noMargin = false
}: {
    def: ColorDef;
    size?: number;
    noMargin?: boolean;
}) => {
    const sizeStyle = { width: size, height: size, marginRight: noMargin ? 0 : undefined };

    return typeof def === 'string' ? (
        <span className={styles.badgeColorCircle} style={{ backgroundColor: def, ...sizeStyle }} />
    ) : (
        <span
            className={styles.badgeColorCircle}
            style={{
                backgroundColor: def.fill,
                boxShadow: `0 0 0 2px ${def.border}`,
                ...sizeStyle
            }}
        />
    );
};
