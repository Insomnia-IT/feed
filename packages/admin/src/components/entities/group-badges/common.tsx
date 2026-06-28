import { Alert, Button, Checkbox, Form, Input, Select } from 'antd';
import { QrcodeOutlined } from '@ant-design/icons';
import { useSelect } from '@refinedev/antd';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Rules } from 'components/form/rules';
import type { DirectionEntity, KitchenEntity, VolunteerRoleEntity } from 'interfaces';
import useVisibleDirections from '../vols/use-visible-directions';
import { QRScannerModal } from 'shared/components/qr-scanner-modal';
import useCanAccess from '../vols/use-can-access';

export const CreateEdit = () => {
    const form = Form.useFormInstance();
    const canDisableGroupBadge = useCanAccess({ action: 'group_badge_disable_edit', resource: 'group-badges' });
    const { selectProps: directionSelectProps } = useSelect<DirectionEntity>({
        resource: 'directions',
        optionLabel: 'name',
        optionValue: 'id',
        pagination: { mode: 'off' }
    });
    const { selectProps: kitchenSelectProps } = useSelect<KitchenEntity>({
        resource: 'kitchens',
        optionLabel: 'name',
        optionValue: 'id',
        pagination: { mode: 'off' }
    });
    const { selectProps: volunteerRoleSelectProps } = useSelect<VolunteerRoleEntity>({
        resource: 'volunteer-roles',
        optionLabel: 'name',
        filters: [
            {
                field: 'is_group_badge',
                operator: 'eq',
                value: true
            }
        ]
    });

    const visibleDirections = useVisibleDirections();
    const directions = directionSelectProps.options?.filter(
        ({ value }) => !visibleDirections || visibleDirections.includes(value as string)
    );
    const groupBadgeRoles = useMemo(
        () =>
            [...(volunteerRoleSelectProps.options ?? [])].sort((left, right) =>
                String(left.label).localeCompare(String(right.label), 'ru')
            ),
        [volunteerRoleSelectProps.options]
    );

    const directionValue = Form.useWatch('direction', form);
    const shouldHideDirectionValue = directionValue != null && (directionSelectProps.options?.length ?? 0) === 0;
    const isDisabledValue = Form.useWatch('is_disabled', form);
    const prevIsDisabledRef = useRef<boolean | undefined>(undefined);

    const [openQrModal, setOpenQrModal] = useState(false);

    useEffect(() => {
        function onHardwareScan(e: CustomEvent<{ scanCode: string }>): void {
            const scanCode = e?.detail?.scanCode;
            if (scanCode) {
                form.setFieldValue('qr', scanCode.replace(/[^A-Za-z0-9]/g, ''));
            }
        }
        document.addEventListener('scan', onHardwareScan);
        return () => {
            document.removeEventListener('scan', onHardwareScan);
        };
    }, [form]);

    useEffect(() => {
        if (
            isDisabledValue !== undefined &&
            prevIsDisabledRef.current !== undefined &&
            prevIsDisabledRef.current !== isDisabledValue
        ) {
            const timestamp = new Date().toLocaleString('ru-RU');
            const statusText = isDisabledValue ? 'выключен' : 'включен';
            const currentComment = form.getFieldValue('comment') || '';
            const newComment = currentComment
                ? `${currentComment}\n${timestamp} ${statusText}`
                : `${timestamp} ${statusText}`;
            form.setFieldValue('comment', newComment);
        }
        prevIsDisabledRef.current = isDisabledValue;
    }, [isDisabledValue, form]);

    return (
        <>
            {isDisabledValue && (
                <Alert
                    message="Бейдж выключен. Бюро выключает бейдж, если им не воспользовались 2 раза. Иди в бюро, если нужно включить его обратно."
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}
            <Form.Item label="Название" name="name" rules={Rules.required}>
                <Input />
            </Form.Item>
            <Form.Item label="Служба/Направление" name="direction" rules={Rules.required}>
                <Select
                    {...directionSelectProps}
                    options={directions}
                    loading={shouldHideDirectionValue || directionSelectProps.loading}
                    value={shouldHideDirectionValue ? undefined : directionSelectProps.value}
                    placeholder={shouldHideDirectionValue ? 'Загрузка...' : undefined}
                />
            </Form.Item>
            <Form.Item label="Роль волонтеров" name="role" rules={Rules.required}>
                <Select {...volunteerRoleSelectProps} options={groupBadgeRoles} />
            </Form.Item>
            <Form.Item label="Кухня" name="kitchen" rules={Rules.required}>
                <Select {...kitchenSelectProps} />
            </Form.Item>
            <Form.Item label="QR" name="qr" rules={Rules.required}>
                <Input.Search
                    onSearch={() => setOpenQrModal(true)}
                    enterButton={<Button icon={<QrcodeOutlined />}></Button>}
                />
            </Form.Item>
            <Form.Item label="Выключен" name="is_disabled" valuePropName="checked">
                <Checkbox disabled={!canDisableGroupBadge} />
            </Form.Item>
            <Form.Item label="Комментарий" name="comment">
                <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} readOnly={!canDisableGroupBadge} />
            </Form.Item>
            <QRScannerModal open={openQrModal} onClose={() => setOpenQrModal(false)} />
        </>
    );
};
