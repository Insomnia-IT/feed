import React, { useState } from 'react';
import type { VolEntity } from 'interfaces';
import { Button, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { SingleField } from './single-field.tsx';
import { useNotification } from '@refinedev/core';
import { ChangeMassEditField } from './mass-edit-types';

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
    [ArrivalField.ArrivalDate]: { title: 'Дата прибытия', type: 'date', fieldName: 'arrival_date', resource: '' },
    [ArrivalField.DepartureDate]: { title: 'Дата отъезда', type: 'date', fieldName: 'departure_date', resource: '' },
    [ArrivalField.ArrivalStatus]: { title: 'Статус заезда', type: 'select', fieldName: 'status', resource: 'statuses' },
    [ArrivalField.ArrivalTransport]: {
        title: 'Как приехал',
        type: 'select',
        fieldName: 'arrival_transport',
        resource: 'transports'
    },
    [ArrivalField.DepartureTransport]: {
        title: 'Как уехал',
        type: 'select',
        fieldName: 'departure_transport',
        resource: 'transports'
    }
};

export const ArrivalsFrame: React.FC<{
    selectedVolunteers: VolEntity[];
    goBack: () => void;
    doChange: ChangeMassEditField;
}> = ({ selectedVolunteers, goBack, doChange }) => {
    const [currentField, setCurrentField] = useState<ArrivalField | undefined>();
    const { open = () => {} } = useNotification();

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

    const valueSetter = (newValue: string | null): void => {
        if (!targetField) {
            open({
                message: 'Ошибка заполнения поля. Изменяемое поле не определено или не выбрано.',
                type: 'error',
                undoableTimeout: 5000
            });

            console.error(
                '<ArrivalsFrame/> error: Ошибка заполнения поля. Изменяемое поле не определено или не выбрано.',
                {
                    targetField,
                    newValue,
                    selectedVolunteers
                }
            );

            return;
        }

        doChange({ isArrival: true, fieldValue: newValue, fieldName: targetField.fieldName });
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
                    setter={valueSetter}
                    title={targetField.title}
                    selectedVolunteers={selectedVolunteers}
                    resource={targetField.resource}
                />
            ) : null}
        </>
    );
};
