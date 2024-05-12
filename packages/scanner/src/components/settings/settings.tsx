import React from 'react';

import { Text } from '~/shared/ui/typography';
import { Button } from '~/shared/ui/button';
import { useApp } from '~/model/app-provider';

import css from './settings.module.css';
const formatDate = (value) => {
    return new Date(value).toLocaleString('ru', {
        day: 'numeric',
        month: 'long',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    });
};

export const Settings = () => {
    const { lastSyncStart, sync } = useApp();

    const { fetching, send } = sync;
    const doSync = async () => {
        try {
            await send({ lastSyncStart });
        } catch (e) {
            console.error(e);
        }
    };
    return (
        <div className={css.settings}>
            <div>
                <Text>Обновление базы важно делать регулярно (минимум раз в 10 минут).</Text>
                <br />
                <Text>
                    <b>Зачем?</b> Например, если в базу внесли нового Волонтера, а у вас эта информация не обновилась,
                    то Волонтер не сможет покушать :(
                </Text>
            </div>
            <Button></Button>
            <div className={css.update}>
                <Button
                    className={css.button}
                    onClick={() => {
                        console.log('sync');
                        void doSync();
                    }}
                    disabled={fetching}
                >
                    Обновить базу
                </Button>
                {!!lastSyncStart && <Text>Последнее обновление: {formatDate(lastSyncStart)}</Text>}
            </div>
        </div>
    );
};
