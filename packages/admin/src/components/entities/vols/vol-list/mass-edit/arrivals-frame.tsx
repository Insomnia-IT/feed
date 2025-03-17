import React, { useState } from 'react';
import type { StatusEntity, VolEntity } from 'interfaces';
import { useSelect } from '@refinedev/core';
import { Button, DatePicker, Select, Typography } from 'antd';
import { ConfirmModal } from './confirm-modal/confirm-modal';
import { getVolunteerCountText } from './get-volunteer-count-text';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Title } = Typography;

enum ArrivalField {
    ArrivalDate = 'ArrivalDate',
    DepartureDate = 'DepartureDate',
    ArrivalStatus = 'ArrivalStatus',
    ArrivalTransport = 'ArrivalTransport',
    DepartureTransport = 'DepartureTransport'
}

interface ISingleFiled {
    title: string;
    type: 'date' | 'select';
    fieldName: string;
    resource: string;
}

const fieldsDictionary: Record<ArrivalField, ISingleFiled> = {
    [ArrivalField.ArrivalDate]: { title: 'Дата прибытия', type: 'date', fieldName: '', resource: '' },
    [ArrivalField.DepartureDate]: { title: 'Дата отъезда', type: 'date', fieldName: '', resource: '' },
    [ArrivalField.ArrivalStatus]: { title: 'Статус заезда', type: 'select', fieldName: '', resource: 'statuses' },
    [ArrivalField.ArrivalTransport]: { title: 'Как приехал', type: 'select', fieldName: '', resource: 'transports' },
    [ArrivalField.DepartureTransport]: { title: 'Как уехал', type: 'select', fieldName: '', resource: 'transports' }
};

export const ArrivalsFrame: React.FC<{ selectedVolunteers: VolEntity[]; goBack: () => void }> = ({
    selectedVolunteers,
    goBack
}) => {
    const [currentField, setCurrentField] = useState<ArrivalField | undefined>();

    const targetField = currentField ? fieldsDictionary[currentField] : undefined;

    const buttons = Object.entries(fieldsDictionary).map(([key, value]) => {
        return (
            <Button
                key={value.title}
                style={{ width: '100%' }}
                onClick={() => {
                    setCurrentField(key as ArrivalField);
                }}
            >
                {value.title}
            </Button>
        );
    });

    const valueSetter = (newValue?: string): void => {
        console.log({ newValue });
    };

    return (
        <>
            {currentField ? (
                <header>
                    <Button
                        size={'small'}
                        onClick={() => {
                            setCurrentField(undefined);
                        }}
                        type={'text'}
                        icon={<ArrowLeftOutlined />}
                    />
                    <Title level={5}>К выбору поля</Title>
                </header>
            ) : (
                <header>
                    <Button
                        size={'small'}
                        onClick={() => {
                            goBack();
                        }}
                        type={'text'}
                        icon={<ArrowLeftOutlined />}
                    />
                    <Title level={5}>К выбору действий</Title>
                </header>
            )}
            {currentField ? null : buttons}
            {targetField ? (
                <SingleField
                    type={targetField.type}
                    name={targetField.fieldName}
                    setter={valueSetter}
                    title={targetField.title}
                    selectedVolunteers={selectedVolunteers}
                    resource={targetField.resource}
                />
            ) : null}
        </>
    );
};

const SingleField: React.FC<{
    type: 'date' | 'select';
    name: string;
    setter: (value?: string) => void;
    title: string;
    selectedVolunteers: VolEntity[];
    resource: string;
}> = ({ selectedVolunteers = [], title, type, resource, setter }) => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
    const [currentValue, setCurrentValue] = useState<string | undefined>();
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

            {type === 'date' ? (
                <DateValueChanger onChange={setCurrentValue} />
            ) : (
                <OptionValueChanger onChange={setCurrentValue} resource={resource} />
            )}
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

const OptionValueChanger: React.FC<{ resource: string; onChange: (value: string) => void }> = ({
    resource,
    onChange
}) => {
    const { options } = useSelect<StatusEntity>({ resource, optionLabel: 'name' });

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
