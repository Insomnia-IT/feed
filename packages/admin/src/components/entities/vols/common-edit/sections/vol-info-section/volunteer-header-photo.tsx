import { useMemo, useState } from 'react';
import { Image, Tooltip, type FormInstance } from 'antd';
import { useSelect } from '@refinedev/core';

import { NEW_API_URL } from 'const';
import HorseIcon from 'assets/icons/horse-icon';
import type { ColorTypeEntity } from 'interfaces';

import { getBadgeAvatarFrameStyle, useVolunteerBadgeColor } from './volunteer-badge-color';

import styles from './volunteer-header-photo.module.css';

interface IProps {
    form: FormInstance;
}

export const VolunteerHeaderPhoto = ({ form }: IProps) => {
    const [imageError, setImageError] = useState(false);

    const { options: colorTypeOptions } = useSelect<ColorTypeEntity>({
        resource: 'colors',
        optionLabel: 'description'
    });

    const { volPhoto, badgeColorLabel, badgeColorDef } = useVolunteerBadgeColor(form, colorTypeOptions);
    const volPhotoUrl = useMemo(() => (volPhoto ? NEW_API_URL + volPhoto : ''), [volPhoto]);
    const frameStyle = useMemo(() => getBadgeAvatarFrameStyle(badgeColorDef), [badgeColorDef]);

    const tooltipTitle = `Цвет бейджа: ${badgeColorLabel}. Определяется автоматически по роли и статусу волонтёра.`;

    return (
        <div className={styles.headerPhoto}>
            <Tooltip title={tooltipTitle}>
                <div className={styles.photoWrap} style={frameStyle} aria-label={`Цвет бейджа: ${badgeColorLabel}`}>
                    {volPhoto && !imageError ? (
                        <Image
                            src={volPhotoUrl}
                            alt="Фото волонтера"
                            width={64}
                            height={64}
                            style={{ objectFit: 'cover', borderRadius: 2 }}
                            onError={() => setImageError(true)}
                            preview={{ toolbarRender: () => null }}
                        />
                    ) : (
                        <HorseIcon />
                    )}
                </div>
            </Tooltip>
        </div>
    );
};
