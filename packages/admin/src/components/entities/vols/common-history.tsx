import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

import { NEW_API_URL } from '~/const';

import styles from './common.module.css';

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
    const historyData = async () => {
        const response: IHistoryData = await axios.get(`${NEW_API_URL}/history/?volunteer_uuid=${uuid}`);
        const result = response.data.results;
        const reversedResult = result.reverse();
        setData(reversedResult);
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
            timeZone: 'UTC'
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

    function returnCurrentField(fieldName: string): string {
        if (fieldName === 'comment') {
            return 'Комментарий';
        } else if (fieldName === 'feed') {
            return 'Тип питания';
        } else if (fieldName === 'first_name') {
            return 'Имя';
        } else if (fieldName === 'gender') {
            return 'Пол';
        } else if (fieldName === 'last_name') {
            return 'Фамилию';
        } else if (fieldName === 'name') {
            return 'Имя на бейдже';
        } else if (fieldName === 'position') {
            return 'Должность';
        } else if (fieldName === 'vegan') {
            return 'Веганство';
        } else if (fieldName === 'phone') {
            return 'Телефон';
        } else if (fieldName === 'arrival_date') {
            return 'Дату приезда';
        } else if (fieldName === 'departure_date') {
            return 'Дату отъезда';
        } else if (fieldName === 'status') {
            return 'Статус';
        } else if (fieldName === 'arrival_transport') {
            return 'Как приехал';
        } else if (fieldName === 'departure_transport') {
            return 'Как уехал';
        } else {
            return fieldName;
        }
    }

    function returnVeganFieldValue(value: boolean | undefined) {
        if (value) {
            return 'Веган';
        } else {
            return 'Мясоед';
        }
    }

    function returnCorrectFieldValue(obj: IData, key: string) {
        if (obj === undefined) return;
        if (key === undefined) return;
        if (key === 'vegan') {
            return returnVeganFieldValue(obj[key]);
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
        if (!data.old_data) return;
        const keysArray = Object.keys(data.old_data);
        return keysArray.map((item) => {
            return (
                <div key={keysArray.indexOf(item)} className={styles.itemDescrWrap}>
                    <span className={styles.itemAction}>{`${returnCurrentField(item)}`}</span>
                    <br />
                    <span className={styles.itemDrescrOld}>{returnCorrectFieldValue(data.old_data, item)}</span>
                    <span className={styles.itemDrescrNew}>{returnCorrectFieldValue(data.data, item)}</span>
                </div>
            );
        });
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
                            {`${item.actor ? item.actor.name : 'Кто-то'}, `}
                        </span>
                        <span className={styles.itemTitle}>{formatDate(item.action_at)}</span>
                        <span className={styles.itemAction}>{`${returnCurrentStatusString(item.status)}`}</span>
                        {item.object_name === 'arrival' ? (
                            <span className={`${styles.itemAction} ${styles.itemActionModif}`}>
                                {`информацию по заезду`}
                            </span>
                        ) : (
                            <span className={`${styles.itemAction} ${styles.itemActionModif}`}>
                                {`информацию по волонтеру`}
                            </span>
                        )}
                        {renderHistoryLayout(item)}
                    </div>
                </div>
            );
        });
    };
    return <div className={styles.historyWrap}>{renderHistory(data)}</div>;
}
