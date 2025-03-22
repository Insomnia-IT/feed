import React, { useState } from 'react';
import type { VolEntity } from 'interfaces';
import { Button, Checkbox, DatePicker, Input, Select, Typography } from 'antd';
import { ConfirmModal } from './confirm-modal/confirm-modal.tsx';
import { getVolunteerCountText } from './get-volunteer-count-text.ts';
import { CheckboxChangeEvent } from 'antd/es/checkbox/Checkbox';
import { useSelect } from '@refinedev/core';
const { Title } = Typography;

export const SingleField: React.FC<{
    type: 'date' | 'select' | 'string' | 'boolean';
    name: string;
    setter: (value?: string) => void;
    title: string;
    selectedVolunteers: VolEntity[];
    resource?: string;
}> = ({ selectedVolunteers = [], title, type, resource, setter }) => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
    const [currentValue, setCurrentValue] = useState<string | undefined>(undefined);
    const confirmChange = (): void => {
        setIsModalOpen(false);
        setter(currentValue);
    };

    const confirmClear = (): void => {
        setIsClearModalOpen(false);
        setter(undefined);
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
                type={'primary'}
                style={{ width: '100%' }}
                onClick={() => {
                    setIsModalOpen(true);
                }}
            >
                Подтвердить
            </Button>
            <Button
                style={{ width: '100%' }}
                onClick={() => {
                    setIsClearModalOpen(true);
                }}
            >
                Очистить поле
            </Button>
            <ConfirmModal
                isOpen={isModalOpen}
                closeModal={(): void => {
                    setIsModalOpen(false);
                }}
                title={'Поменять данные заездов?'}
                description={`${getVolunteerCountText(selectedVolunteers.length)} и меняете поле "${title}".`}
                onConfirm={confirmChange}
            />
            <ConfirmModal
                isOpen={isClearModalOpen}
                closeModal={(): void => {
                    setIsClearModalOpen(false);
                }}
                title={'Очистить поле?'}
                description={`${getVolunteerCountText(selectedVolunteers.length)} и очищаете поле "${title}"!`}
                onConfirm={confirmClear}
            />
        </>
    );
};

const DateValueChanger: React.FC<{ onChange: (value: string) => void }> = ({ onChange }) => {
    return (
        <DatePicker
            style={{ width: '100%' }}
            onChange={(_date, dateString): void => {
                onChange(dateString as string);
            }}
        />
    );
};

const StringValueChanger: React.FC<{ onChange: (value: string) => void }> = ({ onChange }) => {
    return (
        <Input.TextArea
            style={{ width: '100%' }}
            onChange={(event): void => {
                onChange(event.target.value);
            }}
        />
    );
};

const BooleanValueChanger: React.FC<{ onChange: (value: string) => void }> = ({ onChange }) => {
    return (
        <Checkbox
            style={{ width: '100%' }}
            onChange={(event: CheckboxChangeEvent): void => {
                onChange(String(event.target.value));
            }}
        />
    );
};

const OptionValueChanger: React.FC<{ resource: string; onChange: (value: string) => void }> = ({
    resource,
    onChange
}) => {
    const { options } = useSelect({ resource, optionLabel: 'name' });

    const optionsMapped =
        options?.map((item) =>
            // Специальное отображение для поля "статус"
            ['ARRIVED', 'STARTED', 'JOINED'].includes(item.value as string)
                ? { ...item, label: `✅ ${item.label}` }
                : item
        ) ?? [];

    return (
        <Select
            style={{ width: '100%' }}
            onSelect={(value) => {
                onChange(value);
            }}
            options={optionsMapped}
        />
    );
};
