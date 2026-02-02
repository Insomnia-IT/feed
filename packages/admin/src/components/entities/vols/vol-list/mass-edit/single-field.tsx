import { useMemo, useState } from 'react';
import { Button, Checkbox, DatePicker, Input, Select, Typography } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox/Checkbox';
import { useNotification, useSelect } from '@refinedev/core';

import type { VolEntity } from 'interfaces';
import { ConfirmModal } from './confirm-modal/confirm-modal';
import { getVolunteerCountText } from './get-volunteer-count-text';
import useCanAccess from '../../use-can-access';
import {
    getVolunteerStatusOrder,
    isVolunteerCompletedStatusValue,
    isVolunteerStatus
} from 'shared/helpers/volunteer-status';

const { Title } = Typography;

export const SingleField = ({
    currentValue,
    setCurrentValue,
    selectedVolunteers = [],
    title,
    type,
    resource,
    setter,
    hideClearButton = false
}: {
    type: 'date' | 'select' | 'string' | 'boolean';
    setter: (value: string | null) => void;
    title: string;
    selectedVolunteers: VolEntity[];
    resource?: string;
    currentValue: string | undefined;
    setCurrentValue: (value: string | undefined) => void;
    hideClearButton?: boolean;
}) => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
    const { open = () => {} } = useNotification();

    const confirmChange = (): void => {
        setIsModalOpen(false);

        if (typeof currentValue === 'undefined' || !currentValue) {
            open({
                message:
                    'Ошибка заполнения поля. Поле не должно быть пустым.\n Для сброса значения воспользуйтесь кнопкой "Очистить поле"',
                type: 'error',
                undoableTimeout: 5000
            });

            console.error('<SingleField/> error: Ошибка заполнения поля. Поле не должно быть пустым', {
                type,
                title,
                resource,
                selectedVolunteers
            });

            return;
        }

        setter(currentValue);
    };

    const confirmClear = (): void => {
        setIsClearModalOpen(false);
        setter(null);
    };

    return (
        <>
            <Title level={5}>{title}</Title>

            {type === 'date' ? <DateValueChanger onChange={setCurrentValue} /> : null}
            {type === 'select' && resource ? (
                <OptionValueChanger onChange={setCurrentValue} resource={resource} />
            ) : null}
            {type === 'string' ? <StringValueChanger onChange={setCurrentValue} /> : null}
            {type === 'boolean' ? <BooleanValueChanger onChange={setCurrentValue} /> : null}

            <Button
                disabled={!currentValue}
                type="primary"
                style={{ width: '100%' }}
                onClick={() => setIsModalOpen(true)}
            >
                Подтвердить
            </Button>

            {hideClearButton ? null : (
                <Button style={{ width: '100%' }} onClick={() => setIsClearModalOpen(true)}>
                    Очистить поле
                </Button>
            )}

            <ConfirmModal
                isOpen={isModalOpen}
                closeModal={() => setIsModalOpen(false)}
                title="Поменять данные?"
                description={`${getVolunteerCountText(selectedVolunteers.length)} и меняете поле "${title}".`}
                onConfirm={confirmChange}
            />

            <ConfirmModal
                isOpen={isClearModalOpen}
                closeModal={() => setIsClearModalOpen(false)}
                title="Очистить поле?"
                description={`${getVolunteerCountText(selectedVolunteers.length)} и очищаете поле "${title}"!`}
                onConfirm={confirmClear}
            />
        </>
    );
};

const DateValueChanger = ({ onChange }: { onChange: (value: string) => void }) => {
    return (
        <DatePicker
            style={{ width: '100%' }}
            onChange={(_date, dateString) => {
                onChange(dateString as string);
            }}
        />
    );
};

const StringValueChanger = ({ onChange }: { onChange: (value: string) => void }) => {
    return (
        <Input.TextArea
            style={{ width: '100%' }}
            onChange={(event) => {
                onChange(event.target.value);
            }}
        />
    );
};

const BooleanValueChanger = ({ onChange }: { onChange: (value: string) => void }) => {
    return (
        <Checkbox
            style={{ width: '100%' }}
            onChange={(event: CheckboxChangeEvent) => {
                onChange(String(event.target.checked));
            }}
        />
    );
};

const OptionValueChanger = ({
    resource,
    onChange
}: {
    resource: string;
    onChange: (value: string | undefined) => void;
}) => {
    const { options } = useSelect({ resource, optionLabel: 'name' });

    const canStatusArrivedAssign = useCanAccess({ action: 'status_arrived_assign', resource: 'volunteers' });
    const canStatusStartedAssign = useCanAccess({ action: 'status_started_assign', resource: 'volunteers' });

    const statusesOrder = useMemo(() => getVolunteerStatusOrder(canStatusArrivedAssign), [canStatusArrivedAssign]);

    const orderIndex = (value: string) => {
        const idx = statusesOrder.indexOf(value as any);
        return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
    };

    const optionsMapped =
        (options ?? [])
            .slice()
            .map((item) => {
                if (!isVolunteerStatus(item.value)) {
                    return { ...item, disabled: true };
                }

                const withCheck = isVolunteerCompletedStatusValue(item.value)
                    ? { ...item, label: `✅ ${item.label}` }
                    : item;

                const inOrder = statusesOrder.includes(item.value as any);
                const allowedByPerm =
                    (item.value !== 'ARRIVED' || canStatusArrivedAssign) &&
                    (item.value !== 'STARTED' || canStatusStartedAssign);

                return { ...withCheck, disabled: !(inOrder && allowedByPerm) };
            })
            .sort((a, b) => orderIndex(a.value as string) - orderIndex(b.value as string))
            .filter((x) => !x.disabled) ?? [];

    return <Select style={{ width: '100%' }} onSelect={(value) => onChange(value)} options={optionsMapped} />;
};
