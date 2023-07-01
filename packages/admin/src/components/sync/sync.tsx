import React, { useState } from 'react';

import { axios } from '~/authProvider';
import { NEW_API_URL } from '~/const';

const apiUrl = NEW_API_URL;

import { Button, List } from '@pankod/refine-antd';

export const Sync: FC = () => {
    const [disabled, setDisabled] = useState(false);
    const syncNotion = async () => {
        setDisabled(true);
        try {
            const response = await axios.post(`${apiUrl}/notion-sync`);
            if (response.status === 202) {
                alert('Синхронизация из Notion прошла успешно. Синхронизация в Notion выполнилась частично.');

                console.log(response.data);
            }
        } catch (e) {
            alert('При синхронизации возникла ошибка');

            console.log(e);
        } finally {
            setDisabled(false);
        }
    };
    const onClick = () => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        syncNotion();
    };
    return (
        <List>
            <Button disabled={disabled} onClick={onClick}>
                Синхронизация с Notion
            </Button>
        </List>
    );
};
