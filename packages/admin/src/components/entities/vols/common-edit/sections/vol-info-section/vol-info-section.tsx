import React, { useState, useMemo, useCallback } from 'react';
import { Form, Input, Select, Image, Tooltip } from 'antd';
import { useSelect } from '@refinedev/antd';

import { NEW_API_URL } from 'const';
import HorseIcon from 'assets/icons/horse-icon';
import { Rules } from 'components/form';
import useCanAccess from 'components/entities/vols/use-can-access';
import type { DirectionEntity, PersonEntity } from 'interfaces';
import { ColorCircle, ColorDef } from './color-circle/color-circle';

import styles from './vol-info-section.module.css';

const PHOTO_FIELD = 'photo_local';

const BADGE_COLOR_MAP: Record<number, ColorDef> = {
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

const ALLOW_EMPTY_DIRECTIONS_ROLES = new Set(['FELLOW', 'ART_FELLOW', 'VIP', 'PRESS', 'CONTRACTOR']);

interface IProps {
    denyBadgeEdit: boolean;
    canEditGroupBadge: boolean;
    colorTypeOptions: { label: string; value: string | number }[];
    groupBadgeOptions: { label: string; value: string | number }[];
    person: PersonEntity | null;
}

export const VolInfoSection: React.FC<IProps> = ({
    denyBadgeEdit,
    canEditGroupBadge,
    colorTypeOptions,
    groupBadgeOptions,
    person
}) => {
    const form = Form.useFormInstance();
    const [imageError, setImageError] = useState(false);

    const mainRole = Form.useWatch('main_role', form);
    const allowEmptyDirections = ALLOW_EMPTY_DIRECTIONS_ROLES.has(mainRole);
    const allowRoleEdit = useCanAccess({ action: 'role_edit', resource: 'volunteers' });

    const { selectProps: directionsSelectProps } = useSelect<DirectionEntity>({
        resource: 'directions',
        optionLabel: 'name',
        optionValue: 'id'
    });

    const volPhoto = form.getFieldValue(PHOTO_FIELD) as string | undefined;
    const volPhotoUrl = useMemo(() => (volPhoto ? NEW_API_URL + volPhoto : ''), [volPhoto]);

    const colorTypeOptionsWithBadges = useMemo(
        () =>
            colorTypeOptions.map(({ label, value }) => ({
                value,
                label: (
                    <Tooltip title={label}>
                        <span>
                            <ColorCircle def={BADGE_COLOR_MAP[value as number] || '#d9d9d9'} />
                            {label}
                        </span>
                    </Tooltip>
                )
            })),
        [colorTypeOptions]
    );

    const onGroupBadgeClear = useCallback(() => {
        setTimeout(() => form.setFieldValue('group_badge', ''), 0);
    }, [form]);

    return (
        <>
            <div className={styles.formSection__title}>
                <h4>Волонтер</h4>
            </div>
            <div className={styles.personalWrap}>
                <div className={styles.photoWrap}>
                    {volPhoto && !imageError ? (
                        <Image
                            src={volPhotoUrl}
                            alt="Фото волонтера"
                            width={112}
                            height={112}
                            style={{ objectFit: 'cover', borderRadius: 2, border: '1px solid #D9D9D9' }}
                            onError={() => setImageError(true)}
                            preview={{ toolbarRender: () => null }}
                        />
                    ) : (
                        <HorseIcon />
                    )}
                </div>
                <Form.Item name={PHOTO_FIELD} noStyle>
                    <Input type="hidden" />
                </Form.Item>
                <div className={styles.personalInfoWrap}>
                    <div className={styles.twoColumnsWrap}>
                        <Form.Item label="Надпись на бейдже" name="name" rules={Rules.required}>
                            <Input readOnly={denyBadgeEdit} />
                        </Form.Item>
                        <Form.Item label="Групповой бейдж" name="group_badge">
                            <Select
                                allowClear
                                disabled={!canEditGroupBadge}
                                options={groupBadgeOptions}
                                onClear={onGroupBadgeClear}
                            />
                        </Form.Item>
                    </div>
                    <div className={styles.threeColumnsWrap}>
                        <Form.Item label="Имя" name="first_name">
                            <Input readOnly={denyBadgeEdit} />
                        </Form.Item>
                        <Form.Item label="Фамилия" name="last_name">
                            <Input readOnly={denyBadgeEdit} />
                        </Form.Item>
                        <Form.Item label="Позывной" name="nick_name">
                            <Input readOnly={denyBadgeEdit} disabled />
                        </Form.Item>
                    </div>
                </div>
            </div>
            <div className={styles.threeColumnsWrap}>
                <Form.Item
                    label="Служба / Локация"
                    name="directions"
                    rules={allowEmptyDirections ? undefined : Rules.required}
                >
                    <Select mode="multiple" disabled={!allowRoleEdit && !!person} {...directionsSelectProps} />
                </Form.Item>
                <Form.Item label="Номер бейджа" name="badge_number">
                    <Input disabled={denyBadgeEdit} />
                </Form.Item>
                <Form.Item label="Цвет бейджа" name="color_type" className={styles.inputWithEllips}>
                    <Select disabled options={colorTypeOptionsWithBadges} />
                </Form.Item>
            </div>
        </>
    );
};
