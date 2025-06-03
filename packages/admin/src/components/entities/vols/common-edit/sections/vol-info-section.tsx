import { Form, Input, Select, Image } from 'antd';
import { useState } from 'react';
import { Rules } from 'components/form';
import HorseIcon from 'assets/icons/horse-icon';
import styles from '../../common.module.css';
import useCanAccess from '../../use-can-access';
import type { DirectionEntity, PersonEntity } from 'interfaces';
import { useSelect } from '@refinedev/antd';
import { NEW_API_URL } from 'const';

const PHOTO_FIELD = 'photo_local';

export const VolInfoSection = ({
    denyBadgeEdit,
    canEditGroupBadge,
    colorTypeOptions,
    groupBadgeOptions,
    person
}: {
    denyBadgeEdit: boolean;
    denyFeedTypeEdit: boolean;
    feedTypeOptions: { label: string; value: string | number }[];
    kitchenOptions: { label: string; value: string | number }[];
    genderOptions: { label: string; value: string | number }[];
    canEditGroupBadge: boolean;
    colorTypeOptions: { label: string; value: string | number }[];
    groupBadgeOptions: { label: string; value: string | number }[];
    handleQRChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    person: PersonEntity | null;
}) => {
    const form = Form.useFormInstance();
    const [imageError, setImageError] = useState(false);

    const onGroupBadgeClear = () => {
        setTimeout(() => {
            form.setFieldValue('group_badge', '');
        });
    };

    const mainRole = Form.useWatch('main_role', form);

    const allowEmptyDirections = ['FELLOW', 'ART_FELLOW', 'VIP', 'PRESS', 'CONTRACTOR'].includes(mainRole);
    const allowRoleEdit = useCanAccess({ action: 'role_edit', resource: 'volunteers' });
    const { selectProps: directionsSelectProps } = useSelect<DirectionEntity>({
        resource: 'directions',
        optionLabel: 'name',
        optionValue: 'id'
    });

    const volPhoto = form.getFieldValue(PHOTO_FIELD);

    const volPhotoUrl = NEW_API_URL + volPhoto;

    const badgeColorMap: Record<number, string> = {
        1: '#f5222d',
        2: '#52c41a',
        3: '#1890ff',
        4: '#722ed1',
        5: '#fa8c16',
        6: '#fadb14',
        7: '#d9d9d9'
    };

    const getColorCircle = (color: string) => (
        <span className={styles.badgeColorCircle} style={{ backgroundColor: color }} />
    );

    const colorTypeOptionsWithBadges = colorTypeOptions.map(({ label, value }) => {
        const color = badgeColorMap[value as number] || 'default';
        return {
            value,
            label: (
                <span className={styles.badgeColorContainer}>
                    {getColorCircle(color)}
                    {label}
                </span>
            )
        };
    });

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
                            style={{ objectFit: 'cover', borderRadius: '2px', border: '1px solid #D9D9D9' }}
                            onError={() => setImageError(true)}
                            preview={{
                                toolbarRender: () => null
                            }}
                        />
                    ) : (
                        <HorseIcon />
                    )}
                </div>
                <div>
                    <Form.Item name={PHOTO_FIELD} shouldUpdate>
                        <Input type="hidden" />
                    </Form.Item>
                </div>
                <div className={styles.personalInfoWrap}>
                    <div className={styles.twoColumnsWrap}>
                        <Form.Item label="Надпись на бейдже" name="name" rules={Rules.required}>
                            <Input readOnly={denyBadgeEdit} />
                        </Form.Item>
                        <Form.Item label="Групповой бейдж" name="group_badge">
                            <Select
                                disabled={!canEditGroupBadge}
                                allowClear
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
                            <Input readOnly={denyBadgeEdit} disabled={true} />
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
                    <Select disabled={!allowRoleEdit && !!person} mode="multiple" {...directionsSelectProps} />
                </Form.Item>
                <Form.Item label="Номер бейджа" name="badge_number" className={styles.badgeInfoPartItem}>
                    <Input disabled={denyBadgeEdit} />
                </Form.Item>
                <Form.Item label="Цвет бейджа" name="color_type" className={styles.inputWithEllips}>
                    <Select disabled={true} options={colorTypeOptionsWithBadges} />
                </Form.Item>
            </div>
        </>
    );
};
