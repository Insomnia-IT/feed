import { useMemo, useState } from 'react';
import { EyeOutlined } from '@ant-design/icons';
import { Image, Tooltip, type FormInstance } from 'antd';
import { useSelect } from '@refinedev/core';

import { NEW_API_URL } from 'const';
import HorseIcon from 'assets/icons/horse-icon';
import type { ColorTypeEntity } from 'interfaces';

import {
    BADGE_AVATAR_FRAME_OUTSET,
    formatBadgeColorTooltip,
    getBadgeAvatarFrameStyle,
    useVolunteerBadgeColor
} from './volunteer-badge-color';
import type { VolunteerPhotoFieldLayout } from './measure-volunteer-photo-layout';

import styles from './volunteer-header-photo.module.css';

const SECTION_PHOTO_MAX_SIZE = 160;

interface IProps {
    form: FormInstance;
    variant?: 'header' | 'section';
    photoLayout?: VolunteerPhotoFieldLayout | null;
}

export const VolunteerHeaderPhoto = ({ form, variant = 'header', photoLayout = null }: IProps) => {
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

    const isSectionPhoto = variant === 'section';
    const sectionPhotoSize = useMemo(() => {
        if (!isSectionPhoto || !photoLayout || photoLayout.spanHeight <= 0) {
            return null;
        }

        return Math.min(SECTION_PHOTO_MAX_SIZE, photoLayout.spanHeight - BADGE_AVATAR_FRAME_OUTSET * 2);
    }, [isSectionPhoto, photoLayout]);
    const photoSize = isSectionPhoto ? (sectionPhotoSize ?? SECTION_PHOTO_MAX_SIZE) : 64;
    const rootClassName = variant === 'section' ? styles.sectionPhoto : styles.headerPhoto;
    const photoWrapClassName = [
        styles.photoWrap,
        variant === 'section' ? styles.photoWrapSection : '',
        hasPhoto ? styles.photoWrapInteractive : ''
    ]
        .filter(Boolean)
        .join(' ');

    const photoContent = (
        <div
            className={photoWrapClassName}
            style={{
                ...frameStyle,
                ...(isSectionPhoto && sectionPhotoSize
                    ? {
                          width: sectionPhotoSize,
                          height: sectionPhotoSize
                      }
                    : undefined)
            }}
            aria-label={`Цвет бейджа: ${badgeColorLabel}`}
        >
            {hasPhoto ? (
                <Image
                    src={volPhotoUrl}
                    alt="Фото волонтера"
                    width={photoSize}
                    height={photoSize}
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
                                <div className={styles.previewImageFrame} onClick={(event) => event.stopPropagation()}>
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
    );

    return (
        <div className={rootClassName}>
            <Tooltip title={tooltipTitle} placement="bottom">
                {isSectionPhoto && photoLayout && sectionPhotoSize ? (
                    <div
                        className={styles.sectionPhotoAligner}
                        style={{
                            marginTop: Math.max(0, photoLayout.offsetTop - BADGE_AVATAR_FRAME_OUTSET),
                            height: photoLayout.spanHeight,
                            padding: BADGE_AVATAR_FRAME_OUTSET
                        }}
                    >
                        {photoContent}
                    </div>
                ) : (
                    photoContent
                )}
            </Tooltip>
        </div>
    );
};
