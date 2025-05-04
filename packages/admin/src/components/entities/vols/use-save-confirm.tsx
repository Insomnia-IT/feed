import { Modal, ButtonProps, FormInstance } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';

import { dataProvider } from 'dataProvider';
import type { VolCustomFieldValueEntity } from 'interfaces';
import { isActivatedStatus } from 'shared/lib';

const useSaveConfirm = (
    form: FormInstance,
    saveButtonProps: ButtonProps & {
        onClick: () => void;
    }
): {
    onClick: () => void;
    renderModal: () => JSX.Element;
    onMutationSuccess: ({ data }: { data: { id: number } }) => Promise<void>;
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
            if (!arrivals.some(({ status }: { status: string }) => isActivatedStatus(status))) {
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
                            {
                                field: 'volunteer',
                                operator: 'eq',
                                value: id
                            },
                            {
                                field: 'custom_field',
                                operator: 'eq',
                                value: customFieldId
                            }
                        ],
                        resource: 'volunteer-custom-field-values'
                    });
                    const value = updatedCustomFields[customFieldId].toString();

                    if (customValues.length) {
                        if (value === '' || value === 'false') {
                            await dataProvider.deleteOne({
                                resource: 'volunteer-custom-field-values',
                                id: customValues[0].id
                            });
                        } else {
                            await dataProvider.update({
                                resource: 'volunteer-custom-field-values',
                                id: customValues[0].id,
                                variables: {
                                    value
                                }
                            });
                        }
                    } else if (value && value !== 'false') {
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
        },
        renderModal: () => {
            return (
                <Modal
                    title="Сохранение"
                    open={showConfirmationModalReason !== null}
                    onOk={handleOk}
                    onCancel={handleCancel}
                    okText="Сохранить"
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
