import { useMemo } from 'react';
import { Form, type FormInstance } from 'antd';
import type { CSSProperties } from 'react';

import type { ColorDef } from './color-circle/color-circle';

/** Обводка аватара по цвету бейджа (в т.ч. двухцветные варианты 8 и 9). */
export const getBadgeAvatarFrameStyle = (def: ColorDef): CSSProperties => {
    if (typeof def === 'string') {
        return { boxShadow: `0 0 0 2px ${def}` };
    }

    return { boxShadow: `0 0 0 2px ${def.border}, 0 0 0 4px ${def.fill}` };
};

export const BADGE_COLOR_MAP: Record<number, ColorDef> = {
    1: '#f5222d',
    2: '#52c41a',
    3: '#1890ff',
    4: '#722ed1',
    5: '#fa8c16',
    6: '#fadb14',
    7: '#d9d9d9',
    8: { border: '#f5222d', fill: '#52c41a' },
    9: { border: '#f5222d', fill: '#1890ff' }
};

export const useVolunteerBadgeColor = (
    form: FormInstance,
    colorTypeOptions: { label: string; value: string | number }[]
) => {
    const colorType = Form.useWatch('color_type', form);
    const volPhoto = Form.useWatch('photo_local', form) as string | undefined;

    const badgeColorLabel = useMemo(() => {
        if (colorType == null || colorType === '') {
            return 'Не задан';
        }
        return colorTypeOptions?.find(({ value }) => value === colorType)?.label ?? 'Не задан';
    }, [colorType, colorTypeOptions]);

    const badgeColorDef = useMemo((): ColorDef => {
        if (colorType == null || colorType === '') {
            return '#d9d9d9';
        }
        return BADGE_COLOR_MAP[colorType as number] ?? '#d9d9d9';
    }, [colorType]);

    return { volPhoto, badgeColorLabel, badgeColorDef };
};
