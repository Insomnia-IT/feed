import { useState, useMemo, useCallback } from 'react';
import { Form, Input, Select, Image, Tooltip } from 'antd';
import { useList } from '@refinedev/core';
import type { CrudFilters } from '@refinedev/core';
import { useSelect } from '@refinedev/antd';

import { NEW_API_URL } from 'const';
import HorseIcon from 'assets/icons/horse-icon';
import { Rules } from 'components/form';
import { AppRoles } from 'auth';
import useCanAccess from 'components/entities/vols/use-can-access';
import useVisibleDirections from 'components/entities/vols/use-visible-directions';
import type { DirectionEntity, PersonEntity, VolEntity } from 'interfaces';
import { useDebouncedCallback } from 'shared/hooks';
import { ColorCircle, type ColorDef } from './color-circle/color-circle';

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

export const VolInfoSection = ({
    denyBadgeEdit,
    canEditGroupBadge,
    colorTypeOptions,
    groupBadgeOptions,
    person
}: IProps) => {
    const form = Form.useFormInstance();
    const [imageError, setImageError] = useState(false);

    const mainRole = Form.useWatch('main_role', form);
    const directionsValue = Form.useWatch('directions', form);
    const allowEmptyDirections = ALLOW_EMPTY_DIRECTIONS_ROLES.has(mainRole);
    const allowRoleEdit = useCanAccess({ action: 'role_edit', resource: 'volunteers' });
    const visibleDirections = useVisibleDirections();
    const canEditBrigadier = useCanAccess({ action: 'brigadier_edit', resource: 'volunteers' });

    const supervisorId = Form.useWatch('supervisor_id', form);
    const supervisor = Form.useWatch('supervisor', form) as { id: number; name: string } | null;
    const [brigadierSearch, setBrigadierSearch] = useState('');
    const debouncedBrigadierSearch = useDebouncedCallback((value: string) => setBrigadierSearch(value));

    const { selectProps: directionsSelectProps } = useSelect<DirectionEntity>({
        resource: 'directions',
        optionLabel: 'name',
        optionValue: 'id',
        pagination: { mode: 'off' },
        filters: visibleDirections?.length
            ? [
                  {
                      field: 'id',
                      operator: 'in',
                      value: visibleDirections
                  }
              ]
            : []
    });
    const shouldHideDirectionTags =
        (directionsValue?.length ?? 0) > 0 && (directionsSelectProps.options?.length ?? 0) === 0;

    const supervisorFilters = useMemo<CrudFilters>(
        () => [
            {
                field: 'access_role',
                operator: 'eq' as const,
                value: AppRoles.DIRECTION_HEAD
            },
            ...(brigadierSearch
                ? [
                      {
                          field: 'search',
                          operator: 'eq' as const,
                          value: brigadierSearch
                      }
                  ]
                : [])
        ],
        [brigadierSearch]
    );

    const { data: supervisorsData, isLoading: supervisorsLoading } = useList<VolEntity>({
        resource: 'volunteers',
        filters: supervisorFilters,
        pagination: {
            pageSize: 50
        }
    });

    const volPhoto = form.getFieldValue(PHOTO_FIELD) as string | undefined;
    const volPhotoUrl = useMemo(() => (volPhoto ? NEW_API_URL + volPhoto : ''), [volPhoto]);

    const formatVolunteerLabel = useCallback((volunteer: VolEntity): string => {
        const fullName = [volunteer.last_name, volunteer.first_name].filter(Boolean).join(' ');
        const badgeLabel = volunteer.name;
        if (fullName) {
            return badgeLabel ? `${fullName} (${badgeLabel})` : fullName;
        }
        return badgeLabel || `ID ${volunteer.id}`;
    }, []);

    const supervisorOptions = useMemo(() => {
        const supervisors = (supervisorsData?.data ?? []) as VolEntity[];
        const options = supervisors.map((volunteer) => ({
            value: volunteer.id,
            label: formatVolunteerLabel(volunteer)
        }));

        if (supervisorId && !options.some((option) => option.value === supervisorId)) {
            options.unshift({
                value: supervisorId,
                label: supervisor?.name || `ID ${supervisorId}`
            });
        }

        return options;
    }, [formatVolunteerLabel, supervisor, supervisorId, supervisorsData]);

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
                    <Form.Item label="Бригадир" name="supervisor_id">
                        <Select
                            allowClear
                            showSearch
                            placeholder="Найти бригадира"
                            filterOption={false}
                            onSearch={debouncedBrigadierSearch}
                            options={supervisorOptions}
                            loading={supervisorsLoading}
                            disabled={!canEditBrigadier}
                        />
                    </Form.Item>
                </div>
            </div>
            <div className={styles.twoVariableColumnsWrap}>
                <Form.Item
                    label="Служба / Локация"
                    name="directions"
                    rules={allowEmptyDirections ? undefined : Rules.required}
                    className={styles.directionsFormItem}
                >
                    <Select
                        mode="multiple"
                        disabled={!allowRoleEdit && !!person}
                        {...directionsSelectProps}
                        loading={shouldHideDirectionTags || directionsSelectProps.loading}
                        maxTagCount={shouldHideDirectionTags ? 0 : undefined}
                        maxTagPlaceholder={shouldHideDirectionTags ? 'Загрузка...' : undefined}
                    />
                </Form.Item>
                <Form.Item label="Цвет бейджа" name="color_type">
                    <Select disabled options={colorTypeOptionsWithBadges} />
                </Form.Item>
            </div>
        </>
    );
};
