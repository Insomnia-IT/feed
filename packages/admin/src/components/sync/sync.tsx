import { FC, useState } from 'react';

import { axios } from 'authProvider';
import { NEW_API_URL } from 'const';

const apiUrl = NEW_API_URL;

import { Button, List } from '@pankod/refine-antd';

import useCanAccess from '../entities/vols/use-can-access';

import styles from './sync.module.css';

export const Sync: FC = () => {
    const [disabled, setDisabled] = useState(false);
    const canFullEditing = useCanAccess({
        action: 'full_edit',
        resource: 'volunteers'
    });

    const syncNotion = async (isFull = false) => {
        setDisabled(true);
        try {
            const response = await axios.post(`${apiUrl}/notion-sync${isFull ? '?all_data=true' : ''}`);
            if (response.status === 202) {
                alert('Данные из Notion получены успешно. Отправить список активированных не удалось.');

                console.log(response.data);
            }
        } catch (e) {
            alert('При синхронизации возникла ошибка');

            console.log(e);
        } finally {
            setDisabled(false);
        }
    };
    const onSyncClick = () => {
        void syncNotion(false);
    };
    const onFullSyncClick = () => {
        if (confirm('Вы уверены?')) {
            void syncNotion(true);
        }
    };
    return (
        <List>
            <Button disabled={disabled} onClick={onSyncClick}>
                Синхронизация с Notion
            </Button>{' '}
            <Button disabled={disabled || !canFullEditing} onClick={onFullSyncClick} className={styles.fullSyncButton}>
                Полная Синхронизация с Notion
            </Button>
        </List>
    );
};
