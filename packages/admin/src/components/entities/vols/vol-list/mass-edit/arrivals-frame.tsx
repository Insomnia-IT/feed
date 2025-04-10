import React, { useState } from 'react';
import type { VolEntity } from 'interfaces';
import { Button, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { SingleField } from './single-field.tsx';
import { useNotification } from '@refinedev/core';

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

    const valueSetter = (newValue?: string): void => {
        console.log({ newValue });
        open({
            message: 'это поле ещё нельзя менять(',
            type: 'error',
            undoableTimeout: 5000
        });
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
