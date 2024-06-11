import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

import { NEW_API_URL } from '~/const';

import styles from './common.module.css';

import type {
    AccessRoleEntity,
    ColorTypeEntity,
    CustomFieldEntity,
    DirectionEntity,
    FeedTypeEntity,
    KitchenEntity,
    StatusEntity,
    TransportEntity,
    VolEntity,
    VolunteerRoleEntity
} from '~/interfaces';
import { dataProvider } from '~/dataProvider';
import { GetListResponse, useList } from '@pankod/refine-core';

interface IUuid {
    data: {
        uuid: string;
    };
}

interface IHistoryData {
    data: {
        results: Array<IResult>;
    };
}

interface IActor {
    id: number;
    name: string;
}

interface IResult {
    action_at: string;
    actor: IActor | null;
    actor_badge: string;
    by_sync: boolean;
    data: IData;
    object_name: string;
    status: string;
    old_data: IData;
}

interface IData {
    comment?: string;
    feed?: string;
    first_name?: string;
    gender?: string;
    last_name?: string;
    name?: string;
    phone?: string;
    position?: string;
    vegan?: boolean;
    departure_transport?: string;
    arrival_transport?: string;
    status?: string;
    departure_date?: string;
    arrival_date?: string;
    is_blocked?: boolean;
    custom_field?: string;
}

export function CommonHistory() {
    const router = useRouter();
    const [uuid, setUuid] = useState('');
    const [data, setData] = useState<Array<IResult>>();
    const url = document.location.pathname;
    const matchResult = url.match(/\/(\d+)$/);
    const volId = matchResult ? matchResult[1] : null;
    const setNewUuid = async () => {
        const response: IUuid = await axios.get(`${NEW_API_URL}/volunteers/${volId}`);
        const result = response.data.uuid;
        setUuid(result);
    };

    const useMapFromList = (list: GetListResponse | undefined, nameField = 'name') => {
        return useMemo(() => {
            return (list ? list.data : []).reduce(
                (acc, item) => ({
                    ...acc,
                    [item.id as string]: item[nameField]
                }),
                {}
            );
        }, [list]);
    };

    const { data: transports, isLoading: transportsIsLoading } = useList<TransportEntity>({
        resource: 'transports'
    });

    const transportById = useMapFromList(transports);

    const historyData = async () => {
        const response: IHistoryData = await axios.get(`${NEW_API_URL}/history/?volunteer_uuid=${uuid}`);
        const result = response.data.results;
        const reversedResult = result.reverse();
        setData(reversedResult);
        console.log(reversedResult);
        console.log(transportById[3]);
    };
    useEffect(() => {
        void setNewUuid();
    }, []);
    useEffect(() => {
        if (uuid) {
            void historyData();
        }
    }, [uuid]);

    function formatDate(isoDateString: string): string {
        return new Date(isoDateString).toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Moscow',
        });
    }

    const handleRouteClick = async (id: number | undefined) => {
        if (!id) return;
        const stringId = id.toString();
        await router.replace(`/volunteers/edit/${stringId}`);
    };

    function returnCurrentStatusString(status: string): string {
        if (status === 'updated') {
            return 'Обновил';
        } else if (status === 'inserted') {
            return 'Добавил';
        } else if (status === 'deleted') {
            return 'Удалил';
        } else {
            return '';
        }
    }

    const localizedFieldNames = {
        comment: 'Комментарий',
        feed: 'Тип питания',
        first_name: 'Имя',
        gender: 'Пол',
        last_name: 'Фамилию',
        name: 'Имя на бейдже',
        phone: 'Телефон',
        position: 'Должность',
        vegan: 'Веганство',
        departure_transport: 'Как уехал',
        arrival_transport: 'Как приехал',
        status: 'Статус',
        departure_date: 'Дату отъезда',
        arrival_date: 'Дату приезда',
        is_blocked: 'Статус блокировки',
        custom_field: 'Кастомное поле',
    }

    function returnCurrentField(fieldName: string): string {
        return localizedFieldNames[fieldName];
    }

    function returnVeganFieldValue(value: boolean | undefined) {
        if (value) {
            return 'Веган';
        } else {
            return 'Мясоед';
        }
    }

    function returnisBlockedFieldValue(value: boolean | undefined) {
        if (value) {
            return 'Заблокирован';
        } else {
            return 'Разблокирован';
        }
    }

    function returnCorrectFieldValue(obj: IData, key: string) {
        if (key === 'vegan') {
            return returnVeganFieldValue(obj[key]);
        } else if (key === 'is_blocked') {
            return returnisBlockedFieldValue(obj[key]);
        } else if (key === 'comment') {
            const result: string | undefined = obj[key];
            if (!result) return;
            return result.replace(/<\/?[^>]+(>|$)/g, '');
        } else {
            return obj[key];
        }
    }

    function renderHistoryLayout(data: IResult) {
        if (!data) return;
        if (data.old_data) {
            const keysArray = Object.keys(data.old_data);
            return keysArray.map((item) => {
                return (
                    <div key={keysArray.indexOf(item)} className={styles.itemDescrWrap}>
                        <span className={styles.itemAction}>
                            {`${returnCurrentField(item) ? returnCurrentField(item) : `Кастомное поле № ${data.data.custom_field}`}`}
                        </span>
                        <br />
                        <span className={styles.itemDrescrOld}>{returnCorrectFieldValue(data.old_data, item)}</span>
                        <span className={styles.itemDrescrNew}>{returnCorrectFieldValue(data.data, item)}</span>
                    </div>
                );
            });
        } else {
            const keysArray = Object.keys(data.data);
            return keysArray.map((item) => {
                if (data.object_name !== 'arrival' && item !== 'value') return;
                if (item === 'badge' || item === 'deleted' || item === 'id') return;
                return (
                    <div key={keysArray.indexOf(item)} className={styles.itemDescrWrap}>
                        <span className={styles.itemAction}>
                            {`${returnCurrentField(item) ? returnCurrentField(item) : `Кастомное поле № ${data.data.custom_field}`}`}
                        </span>
                        <br />
                        <span className={styles.itemDrescrNew}>{returnCorrectFieldValue(data.data, item)}</span>
                    </div>
                );
            });
        }
    }

    function getCorrectTitleEvent(typeInfo: string) {
        if (typeInfo === 'arrival') {
            return (
                <span className={`${styles.itemAction} ${styles.itemActionModif}`}>
                    {`информацию по заезду`}
                </span>
            );
        } else if (typeInfo === 'volunteer') {
            return (
                <span className={`${styles.itemAction} ${styles.itemActionModif}`}>
                    {`информацию по волонтеру`}
                </span>
            );
        } else if (typeInfo === 'volunteercustomfieldvalue') {
            return (
                <span className={`${styles.itemAction} ${styles.itemActionModif}`}>
                    {`информацию по кастомному полю`}
                </span>
            );
        } else {
            <span className={`${styles.itemAction} ${styles.itemActionModif}`}>
                {`срочно сообщите о баге, если видите это!`}
            </span>
        }
    }

    const renderHistory = (array: Array<IResult> | undefined) => {
        if (array === undefined) {
            return 'ИЗМЕНЕНИЙ НЕТ';
        }
        return array.map((item) => {
            const geiId = () => {
                if (!item.actor) return;
                if (item.actor.id) {
                    return item.actor.id;
                } else {
                    return;
                }
            };
            const id = geiId();
            return (
                <div key={array.indexOf(item)} className={styles.historyItem}>
                    <div className={styles.itemTitleWrap}>
                        <span
                            className={`${styles.itemTitle} ${styles.itemTitleRoute}`}
                            onClick={() => {
                                void handleRouteClick(id);
                            }}
                        >
                            {`${item.actor ? item.actor.name : 'Админ'}, `}
                        </span>
                        <span className={styles.itemTitle}>{formatDate(item.action_at)}</span>
                        <span className={styles.itemAction}>{`${returnCurrentStatusString(item.status)}`}</span>
                        {getCorrectTitleEvent(item.object_name)}
                        {renderHistoryLayout(item)}
                    </div>
                </div>
            );
        });
    };
    return <div className={styles.historyWrap}>{renderHistory(data)}</div>;
}
