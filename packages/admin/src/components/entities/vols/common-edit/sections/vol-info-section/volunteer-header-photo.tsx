import { useEffect, useMemo, useState } from 'react';
import { EyeOutlined } from '@ant-design/icons';
import { Image, Tooltip, type FormInstance } from 'antd';
import { useSelect } from '@refinedev/core';

import { NEW_API_URL } from 'const';
import HorseIcon from 'assets/icons/horse-icon';
import type { ColorTypeEntity } from 'interfaces';

import { formatBadgeColorTooltip, getBadgeAvatarFrameStyle, useVolunteerBadgeColor } from './volunteer-badge-color';

import styles from './volunteer-header-photo.module.css';

interface IProps {
    form: FormInstance;
}

export const VolunteerHeaderPhoto = ({ form }: IProps) => {
    const [imageError, setImageError] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);

    const { options: colorTypeOptions } = useSelect<ColorTypeEntity>({
        resource: 'colors',
        optionLabel: 'description'
    });

    const { volPhoto, badgeColorLabel, badgeColorDef } = useVolunteerBadgeColor(form, colorTypeOptions);
    const volPhotoUrl = useMemo(() => (volPhoto ? NEW_API_URL + volPhoto : ''), [volPhoto]);
    const frameStyle = useMemo(() => getBadgeAvatarFrameStyle(badgeColorDef), [badgeColorDef]);
    const hasPhoto = Boolean(volPhoto && !imageError);

    useEffect(() => {
        setImageError(false);
        setPreviewOpen(false);
    }, [volPhotoUrl]);

    const tooltipTitle = useMemo(() => formatBadgeColorTooltip(badgeColorLabel), [badgeColorLabel]);

    return (
        <div className={styles.headerPhoto}>
            <Tooltip title={tooltipTitle}>
                <div
                    className={`${styles.photoWrap} ${hasPhoto ? styles.photoWrapInteractive : ''}`}
                    style={frameStyle}
                    aria-label={`Цвет бейджа: ${badgeColorLabel}`}
                >
                    {hasPhoto ? (
                        <Image
                            src={volPhotoUrl}
                            alt="Фото волонтера"
                            width={64}
                            height={64}
                            style={{ objectFit: 'cover', borderRadius: 2 }}
                            onError={() => setImageError(true)}
                            preview={{
                                visible: previewOpen,
                                onVisibleChange: setPreviewOpen,
                                toolbarRender: () => null,
                                mask: (
                                    <span className={styles.previewMask} aria-hidden>
                                        <EyeOutlined />
                                    </span>
                                ),
                                imageRender: (node) => (
                                    <div
                                        className={styles.previewImageWrap}
                                        onClick={() => setPreviewOpen(false)}
                                        role="button"
                                        tabIndex={0}
                                        aria-label="Закрыть просмотр фото"
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                setPreviewOpen(false);
                                            }
                                        }}
                                    >
                                        {node}
                                    </div>
                                )
                            }}
                        />
                    ) : (
                        <HorseIcon />
                    )}
                </div>
            </Tooltip>
        </div>
    );
};
