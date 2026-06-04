import { useMemo, useCallback, useState } from 'react';
import { Form, Input, Select, Tooltip, Row, Col } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useList } from '@refinedev/core';
import type { CrudFilters } from '@refinedev/core';
import { useSelect } from '@refinedev/antd';

import { Rules } from 'components/form';
import { AppRoles } from 'auth';
import useCanAccess from 'components/entities/vols/use-can-access';
import useVisibleDirections from 'components/entities/vols/use-visible-directions';
import type { DirectionEntity, PersonEntity, VolEntity } from 'interfaces';
import { useDebouncedCallback } from 'shared/hooks';
import commonStyles from '../../../common.module.css';
import styles from './vol-info-section.module.css';
import { formatVolunteerLabel } from 'shared/utils/format-volunteer-label';

const PHOTO_FIELD = 'photo_local';

const ALLOW_EMPTY_DIRECTIONS_ROLES = new Set(['FELLOW', 'ART_FELLOW', 'VIP', 'PRESS', 'CONTRACTOR']);

interface IProps {
    denyBadgeEdit: boolean;
    canEditGroupBadge: boolean;
    groupBadgeOptions: { label: string; value: string | number }[];
    person: PersonEntity | null;
}

export const VolInfoSection = ({ denyBadgeEdit, canEditGroupBadge, groupBadgeOptions, person }: IProps) => {
    const form = Form.useFormInstance();

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
    const directionsOnSearch = directionsSelectProps.onSearch;

    const onDirectionsDropdownVisibleChange = useCallback(() => {
        directionsOnSearch?.('');
    }, [directionsOnSearch]);
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

    const { result: supervisorsResult, query: supervisorsQuery } = useList<VolEntity>({
        resource: 'volunteers',
        filters: supervisorFilters,
        pagination: {
            mode: 'server',
            currentPage: 1,
            pageSize: 50
        }
    });
    const supervisorsData = supervisorsResult.data ?? [];
    const supervisorsLoading = supervisorsQuery.isLoading;

    const supervisorOptions = useMemo(() => {
        const options = supervisorsData.map((volunteer) => ({
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
    }, [supervisor, supervisorId, supervisorsData]);

    const normalizeGroupBadge = useCallback((value: string | number | null | undefined) => {
        if (value === undefined || value === null || value === '') {
            return null;
        }

        const numericValue = Number(value);
        return Number.isNaN(numericValue) ? null : numericValue;
    }, []);

    return (
        <>
            <div className={commonStyles.formSection__title}>
                <h4>Волонтер</h4>
            </div>
            <Form.Item name="color_type" hidden>
                <Input />
            </Form.Item>
            <Form.Item name={PHOTO_FIELD} noStyle>
                <Input type="hidden" />
            </Form.Item>
            <div className={styles.personalInfoWrap}>
                <Row gutter={[12, 0]}>
                    <Col xs={24} sm={14}>
                        <Form.Item label="Надпись на бейдже" name="name" rules={Rules.required}>
                            <Input readOnly={denyBadgeEdit} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={10}>
                        <Form.Item
                            className={styles.readOnlyField}
                            label={
                                <span>
                                    Позывной
                                    <Tooltip title="Подтягивается из профиля волонтёра, вручную не редактируется">
                                        <InfoCircleOutlined className={styles.labelHint} />
                                    </Tooltip>
                                </span>
                            }
                            name="nick_name"
                        >
                            <Input readOnly disabled />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={[12, 0]}>
                    <Col xs={24} sm={12}>
                        <Form.Item label="Имя" name="first_name">
                            <Input readOnly={denyBadgeEdit} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item label="Фамилия" name="last_name">
                            <Input readOnly={denyBadgeEdit} />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={[12, 0]}>
                    <Col xs={24} sm={24} md={10}>
                        <Form.Item
                            label="Служба / Локация"
                            name="directions"
                            rules={allowEmptyDirections ? undefined : Rules.required}
                        >
                            <Select
                                mode="multiple"
                                disabled={!allowRoleEdit && !!person}
                                {...directionsSelectProps}
                                autoClearSearchValue
                                onDropdownVisibleChange={onDirectionsDropdownVisibleChange}
                                loading={shouldHideDirectionTags || directionsSelectProps.loading}
                                maxTagCount={shouldHideDirectionTags ? 0 : undefined}
                                maxTagPlaceholder={shouldHideDirectionTags ? 'Загрузка...' : undefined}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={7}>
                        <Form.Item label="Бригадир" name="supervisor_id" normalize={(value) => value ?? null}>
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
                    </Col>
                    <Col xs={24} sm={12} md={7}>
                        <Form.Item label="Групповой бейдж" name="group_badge" normalize={normalizeGroupBadge}>
                            <Select
                                allowClear
                                placeholder="Не выбран"
                                disabled={!canEditGroupBadge}
                                options={groupBadgeOptions}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </div>
        </>
    );
};
