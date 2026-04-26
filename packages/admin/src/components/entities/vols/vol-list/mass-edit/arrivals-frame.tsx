import { useState } from 'react';
import type { VolEntity } from 'interfaces';
import { Button, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { SingleField } from './single-field';
import { useNotification } from '@refinedev/core';
import type { ChangeMassEditField } from './mass-edit-types';
import { ConfirmModal } from './confirm-modal/confirm-modal';
import { canBeVolunteerArrivalChanged, findTargetArrival } from './utils';
import { useArrivalDates } from './arrival-dates-context/arrival-dates-context';
import dayjs from 'dayjs';

const { Title } = Typography;

const ArrivalField = {
    ArrivalDate: 'ArrivalDate',
    DepartureDate: 'DepartureDate',
    ArrivalStatus: 'ArrivalStatus',
    ArrivalTransport: 'ArrivalTransport',
    DepartureTransport: 'DepartureTransport'
} as const;

type ArrivalField = (typeof ArrivalField)[keyof typeof ArrivalField];

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

export const ArrivalsFrame = ({
    selectedVolunteers,
    goBack,
    doChange
}: {
    selectedVolunteers: VolEntity[];
    goBack: () => void;
    doChange: ChangeMassEditField;
}) => {
    const [isWarningModalOpen, setIsWarningModalOpen] = useState<boolean>(false);
    const [currentValue, setCurrentValue] = useState<string | undefined>(undefined);
    const [currentField, setCurrentField] = useState<ArrivalField | undefined>();
    const { open = () => {} } = useNotification();
    const { setDate, clearDate, date, dateType } = useArrivalDates();

    const setFieldWithCheck = (key: ArrivalField) => {
        if (selectedVolunteers.some((vol) => !findTargetArrival(vol))) {
            setIsWarningModalOpen(true);

            return;
        }

        setCurrentField(key);
    };

    const targetField = currentField ? fieldsDictionary[currentField] : undefined;

    const buttons = Object.entries(fieldsDictionary).map(([key, value]) => {
        return (
            <Button
                key={value.title}
                style={{ width: '100%' }}
                onClick={() => {
                    setFieldWithCheck(key as ArrivalField);
                }}
            >
                {value.title}
            </Button>
        );
    });

    const valueSetter = (newValue: string | null): void => {
        if (selectedVolunteers.some((vol) => canBeVolunteerArrivalChanged(vol, date, dateType))) {
            setIsWarningModalOpen(true);

            return;
        }

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

        clearDate();
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
                            clearDate();
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
                            clearDate();
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
                    currentValue={currentValue}
                    setCurrentValue={(value: string | undefined) => {
                        setCurrentValue(value);

                        const dayjsValue = dayjs(value);

                        if (currentField === 'ArrivalDate' && dayjsValue.isValid()) {
                            setDate(dayjsValue, 'start');
                        }

                        if (currentField === 'DepartureDate' && dayjsValue.isValid()) {
                            setDate(dayjsValue, 'end');
                        }

                        if (!value) {
                            clearDate();
                        }
                    }}
                    type={targetField.type}
                    setter={valueSetter}
                    title={targetField.title}
                    selectedVolunteers={selectedVolunteers}
                    resource={targetField.resource}
                    hideClearButton
                />
            ) : null}
            <ConfirmModal
                isOpen={isWarningModalOpen}
                closeModal={(): void => {
                    setIsWarningModalOpen(false);
                }}
                title={'Волонтеры без заездов'}
                description={
                    'Имеются волонтеры с неподходящими для групповой операции заездами. Повторите групповую операцию без них, а потом отредактируйте их через карточку волонтера.'
                }
                onConfirm={() => {}}
                disableOkButton
            />
        </>
    );
};
