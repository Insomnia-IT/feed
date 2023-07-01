import { Create, Form, Input, Modal, Select, useForm, useSelect } from '@pankod/refine-antd';
import type { IResourceComponentsProps } from '@pankod/refine-core';
import { useState } from 'react';

import type { VolEntity } from '~/interfaces';

import { CreateEdit } from './common';

export const VolCreate: FC<IResourceComponentsProps> = () => {
    const { form, formProps, saveButtonProps } = useForm<VolEntity>();
    const [isSaveConfirmationModalOpened, setIsSaveConfirmationModalOpened] = useState(false);

    const handleOk = () => {
        setIsSaveConfirmationModalOpened(false);
        saveButtonProps?.onClick();
    };

    const handleCancel = () => {
        setIsSaveConfirmationModalOpened(false);
    };

    return (
        <Create
            saveButtonProps={{
                ...saveButtonProps,
                onClick: () => {
                    if (!form.getFieldValue('is_active')) {
                        setIsSaveConfirmationModalOpened(true);
                    } else {
                        saveButtonProps?.onClick();
                    }
                }
            }}
        >
            <Form {...formProps} layout='vertical'>
                <CreateEdit form={form} />
            </Form>
            <Modal
                title='Сохранение'
                open={isSaveConfirmationModalOpened}
                onOk={handleOk}
                onCancel={handleCancel}
                okText='Сохранить'
            >
                <p>Пользователь не активирован. Вы уверены, что хотите продолжить сохранение?</p>
                <p>Новый неактивированный пользователь будет заблокирован после синхронизации с ноушен.</p>
            </Modal>
        </Create>
    );
};
