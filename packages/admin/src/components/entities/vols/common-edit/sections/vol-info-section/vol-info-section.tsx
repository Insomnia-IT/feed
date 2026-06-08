import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Form, Input, Select, Tooltip, Row, Col, Checkbox } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useSelect } from '@refinedev/antd';

import { Rules } from 'components/form';
import { useScreen } from 'shared/providers';
import useCanAccess from 'components/entities/vols/use-can-access';
import useVisibleDirections from 'components/entities/vols/use-visible-directions';
import type { DirectionEntity, PersonEntity } from 'interfaces';
import commonStyles from '../../../common.module.css';
import styles from './vol-info-section.module.css';
import { measureVolunteerPhotoFieldLayout, type VolunteerPhotoFieldLayout } from './measure-volunteer-photo-layout';
import { VolunteerHeaderPhoto } from './volunteer-header-photo';

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
    const { breakpoint } = useScreen();
    const fieldsRef = useRef<HTMLDivElement>(null);
    const [measuredPhotoLayout, setMeasuredPhotoLayout] = useState<VolunteerPhotoFieldLayout | null>(null);
    const showSectionPhoto = Boolean(breakpoint.sm);
    const photoLayout = showSectionPhoto ? measuredPhotoLayout : null;

    const mainRole = Form.useWatch('main_role', form);
    const directionsValue = Form.useWatch('directions', form);
    const allowEmptyDirections = ALLOW_EMPTY_DIRECTIONS_ROLES.has(mainRole);
    const allowRoleEdit = useCanAccess({ action: 'role_edit', resource: 'volunteers' });
    const visibleDirections = useVisibleDirections();

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

    useLayoutEffect(() => {
        if (!showSectionPhoto) {
            return;
        }

        const node = fieldsRef.current;
        if (!node) {
            return;
        }

        const updatePhotoLayout = () => {
            setMeasuredPhotoLayout(measureVolunteerPhotoFieldLayout(node));
        };

        updatePhotoLayout();

        const observer = new ResizeObserver(updatePhotoLayout);
        observer.observe(node);

        return () => observer.disconnect();
    }, [directionsValue, shouldHideDirectionTags, showSectionPhoto]);

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
            <div ref={fieldsRef} className={styles.personalInfoWrap}>
                <div className={styles.personalInfoLayout}>
                    {showSectionPhoto ? (
                        <div className={styles.personalInfoPhotoSlot}>
                            <VolunteerHeaderPhoto form={form} variant="section" photoLayout={photoLayout} />
                        </div>
                    ) : null}
                    <div className={styles.personalInfoFieldsColumn}>
                        <div className={styles.personalInfoFieldsPrimary}>
                            <Row gutter={[12, 0]} className={styles.badgeRow}>
                                <Col xs={24} sm={12} data-vol-field-anchor="badge-label">
                                    <Form.Item label="Надпись на бейдже" name="name" rules={Rules.required}>
                                        <Input readOnly={denyBadgeEdit} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12}>
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
                                <Col xs={24} sm={12} data-vol-field-anchor="name-row-end">
                                    <Form.Item label="Фамилия" name="last_name">
                                        <Input readOnly={denyBadgeEdit} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>
                        <div className={styles.personalInfoFieldsSecondary}>
                            <Row gutter={[12, 0]} className={styles.secondaryFieldsRow}>
                                <Col
                                    flex="1 1 0"
                                    className={`${styles.secondaryFieldCol} ${styles.directionsFieldCol}`}
                                    data-vol-field-anchor="directions-field"
                                >
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
                                <Col flex="1 1 0" className={styles.secondaryFieldCol}>
                                    <Form.Item
                                        label="Групповой бейдж"
                                        name="group_badge"
                                        normalize={normalizeGroupBadge}
                                    >
                                        <Select
                                            allowClear
                                            placeholder="Не выбран"
                                            disabled={!canEditGroupBadge}
                                            options={groupBadgeOptions}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col flex="none" className={styles.infantCheckboxCol}>
                                    <Form.Item
                                        name="infant"
                                        valuePropName="checked"
                                        className={styles.infantCheckboxItem}
                                        label=" "
                                        colon={false}
                                    >
                                        <Checkbox>&lt;18 лет</Checkbox>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
