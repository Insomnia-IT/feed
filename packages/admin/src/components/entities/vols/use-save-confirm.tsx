import type { ButtonProps, FormInstance } from '@pankod/refine-antd';
import { Modal } from '@pankod/refine-antd';
import dayjs from 'dayjs';
import { useState } from 'react';

import { dataProvider } from '~/dataProvider';
import type { VolCustomFieldValueEntity } from '~/interfaces';
import { isActivatedStatus } from '~/shared/lib';

const useSaveConfirm = (
    form: FormInstance,
    saveButtonProps: ButtonProps & {
        onClick: () => void;
    }
): {
    onClick: () => void;
    renderModal: () => JSX.Element;
    onMutationSuccess: ({ data }: { data: any }) => Promise<void>;
} => {
    const [showConfirmationModalReason, setShowConfirmationModalReason] = useState<null | 'is_active' | 'active_from'>(
        null
    );

    const handleOk = () => {
        setShowConfirmationModalReason(null);
        saveButtonProps?.onClick();
    };

    const handleCancel = () => {
        setShowConfirmationModalReason(null);
    };

    return {
        onClick: () => {
            const arrivals = form.getFieldValue('arrivals') ?? [];
            const activeFrom = form.getFieldValue(['arrivals', 0, 'arrival_date']);
            if (!arrivals.some(({ status }) => isActivatedStatus(status))) {
                setShowConfirmationModalReason('is_active');
            } else if (activeFrom && dayjs(activeFrom).valueOf() >= dayjs().startOf('day').add(1, 'day').valueOf()) {
                setShowConfirmationModalReason('active_from');
            } else {
                saveButtonProps?.onClick();
            }
        },
        onMutationSuccess: async ({ data: { id } }) => {
            const updatedCustomFields = form.getFieldValue('updated_custom_fields');
            if (updatedCustomFields) {
                for (const customFieldId in updatedCustomFields) {
                    const { data: customValues } = await dataProvider.getList<VolCustomFieldValueEntity>({
                        filters: [
                            { field: 'volunteer', operator: 'eq', value: id },
                            { field: 'custom_field', operator: 'eq', value: customFieldId }
                        ],
                        resource: 'volunteer-custom-field-values'
                    });
                    const value = updatedCustomFields[customFieldId].toString();

                    if (customValues.length) {
                        await dataProvider.update({
                            resource: 'volunteer-custom-field-values',
                            id: customValues[0].id,
                            variables: {
                                value
                            }
                        });
                    } else {
                        await dataProvider.create({
                            resource: 'volunteer-custom-field-values',
                            variables: {
                                volunteer: id,
                                custom_field: parseFloat(customFieldId),
                                value
                            }
                        });
                    }
                }
            }
            const arrivals = form.getFieldValue('arrivals') ?? [];
            const updatedArrivals = form.getFieldValue('updated_arrivals');
            if (updatedArrivals) {
                const serializeDate = (value) => {
                    return dayjs(value).format('YYYY-MM-DD');
                };
                for (let i = 0; i < updatedArrivals.length; i++) {
                    const updatedArrival = updatedArrivals[i];

                    const arrival = arrivals.find((a) => a.id === updatedArrival.id);
                    if (arrival) {
                        if (JSON.stringify(updatedArrival) !== JSON.stringify(arrival)) {
                            const serializeField = (obj, fieldName) => {
                                if (fieldName === 'arrival_date' || fieldName === 'departure_date') {
                                    return serializeDate(obj[fieldName]);
                                }
                                return obj[fieldName];
                            };
                            await dataProvider.update({
                                resource: 'arrivals',
                                id: updatedArrival.id,
                                variables: Object.keys(updatedArrival).reduce(
                                    (acc, name) => ({
                                        ...acc,
                                        [name]:
                                            updatedArrival[name] !== arrival[name]
                                                ? serializeField(updatedArrival, name)
                                                : undefined
                                    }),
                                    {}
                                )
                            });
                        }
                    } else {
                        await dataProvider.create({
                            resource: 'arrivals',
                            variables: {
                                ...updatedArrival,
                                arrival_date: serializeDate(updatedArrival.arrival_date),
                                departure_date: serializeDate(updatedArrival.departure_date),
                                volunteer: id
                            }
                        });
                    }
                }

                for (let i = 0; i < arrivals.length; i++) {
                    const arrivalId = arrivals[i].id;
                    const upadatedArrival = updatedArrivals.find((a) => a.id === arrivalId);
                    if (!upadatedArrival) {
                        await dataProvider.deleteOne({
                            resource: 'arrivals',
                            id: arrivalId
                        });
                    }
                }
            }
        },
        renderModal: () => {
            return (
                <Modal
                    title='Сохранение'
                    open={showConfirmationModalReason !== null}
                    onOk={handleOk}
                    onCancel={handleCancel}
                    okText='Сохранить'
                >
                    {showConfirmationModalReason === 'is_active' && (
                        <>
                            <p>Пользователь не активирован. Вы уверены, что хотите продолжить сохранение?</p>
                            <p>Неактивированный пользователь не будет получать питание.</p>
                            <p>Для активанции выставите статус заезда в &quot;Заехал на поле&quot;</p>
                        </>
                    )}
                    {showConfirmationModalReason === 'active_from' && (
                        <>
                            <p>Дата активности бейджа еще не наступила.</p>
                            <p>Сегодня бейдж не будет разрешать питаться.</p>
                            <p>Вы уверены, что хотите продолжить сохранение?</p>
                        </>
                    )}
                </Modal>
            );
        }
    };
};

export default useSaveConfirm;
