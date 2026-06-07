import { useMemo, useState } from 'react';
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
    const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
    const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

    const { options: colorTypeOptions } = useSelect<ColorTypeEntity>({
        resource: 'colors',
        optionLabel: 'description'
    });

    const { volPhoto, badgeColorLabel, badgeColorDef } = useVolunteerBadgeColor(form, colorTypeOptions);
    const volPhotoUrl = useMemo(() => (volPhoto ? NEW_API_URL + volPhoto : ''), [volPhoto]);
    const frameStyle = useMemo(() => getBadgeAvatarFrameStyle(badgeColorDef), [badgeColorDef]);
    const hasPhoto = Boolean(volPhoto && failedPhotoUrl !== volPhotoUrl);
    const previewOpen = previewPhotoUrl === volPhotoUrl && hasPhoto;

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
                            onError={() => setFailedPhotoUrl(volPhotoUrl)}
                            preview={{
                                visible: previewOpen,
                                onVisibleChange: (visible) => setPreviewPhotoUrl(visible ? volPhotoUrl : null),
                                rootClassName: styles.photoPreview,
                                maskClosable: true,
                                toolbarRender: () => null,
                                mask: (
                                    <span className={styles.previewMask} aria-hidden>
                                        <EyeOutlined />
                                    </span>
                                ),
                                imageRender: (node) => (
                                    <div
                                        className={styles.previewStage}
                                        onClick={() => setPreviewPhotoUrl(null)}
                                        role="presentation"
                                    >
                                        <div
                                            className={styles.previewImageFrame}
                                            onClick={(event) => event.stopPropagation()}
                                        >
                                            {node}
                                        </div>
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
