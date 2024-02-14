import type { ButtonProps, FormInstance } from '@pankod/refine-antd';
import { Modal } from '@pankod/refine-antd';
import dayjs from 'dayjs';
import { useState } from 'react';

import { dataProvider } from '~/dataProvider';
import type { VolCustomFieldValueEntity } from '~/interfaces';

const useSaveConfirm = (
    form: FormInstance,
    saveButtonProps: ButtonProps & {
        onClick: () => void;
    }
): { onClick: () => Promise<void>; renderModal: () => JSX.Element } => {
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
        onClick: async () => {
            const id = form.getFieldValue('id');
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
            const activeFrom = form.getFieldValue('active_from');
            if (!form.getFieldValue('is_active')) {
                setShowConfirmationModalReason('is_active');
            } else if (activeFrom && dayjs(activeFrom).valueOf() >= dayjs().startOf('day').add(1, 'day').valueOf()) {
                setShowConfirmationModalReason('active_from');
            } else {
                saveButtonProps?.onClick();
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
                            <p>Новый неактивированный пользователь будет заблокирован после синхронизации с ноушен.</p>
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
