import { useEffect, useState } from 'react';
import axios from 'axios';

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

interface IResult {
    action_at: string,
    actor: string | null,
    actor_badge: string,
    by_sync: boolean,
    data: IData,
    object_name: string,
    status: string,
    old_data: IData
}

interface IData {
    comment?: string,
    feed?: string,
    first_name?: string,
    gender?: string,
    last_name?: string,
    name?: string,
    phone?: string,
    position?: string,
    vegan?: boolean,
}

export function CommonHistory() {
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
        console.log(result);
        setData(result);
    };
    useEffect(() => {
        setNewUuid();
    }, []);
    useEffect(() => {
        historyData();
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

    function returnCurrentStatusString(status: string): string {
        if (status === 'updated') {
            return 'Обновил'
        } else if (status === 'inserted') {
            return 'Добавил'
        } else if (status === 'deleted') {
            return 'Удалил'
        } else {
            return '';
        }
    }

    function returnCurrentField(fieldName: string): string {
        if (fieldName === 'comment') {
            return 'Комментарий'
        } else if (fieldName === 'feed') {
            return 'Тип питания'
        } else if (fieldName === 'first_name') {
            return 'Имя'
        } else if (fieldName === 'gender') {
            return 'Пол'
        } else if (fieldName === 'last_name') {
            return 'Фамилию'
        } else if (fieldName === 'name') {
            return 'Имя на бейдже'
        } else if (fieldName === 'position') {
            return 'Должность'
        } else if (fieldName === 'vegan') {
            return 'Веганство'
        } else if (fieldName === 'phone') {
            return 'Телефон'
        } else {
            return '';
        }
    }

    function returnVeganFieldValue(value: boolean | undefined) {
        if (value) {
            return 'Веган'
        } else {
            return 'Мясоед'
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
            return result.replace(/<\/?[^>]+(>|$)/g, "");
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
                    <span className={styles.itemAction}>
                        {`${returnCurrentField(item)}`}
                    </span>
                    <br />
                    <span className={styles.itemDrescrOld}>
                        {returnCorrectFieldValue(data.old_data, item)}
                    </span>
                    <span className={styles.itemDrescrNew}>
                        {returnCorrectFieldValue(data.data, item)}
                    </span>
                </div>
            )
        })
    }

    const renderHistory = (array: Array<IResult> | undefined) => {
        if (array === undefined) {
            return 'ИЗМЕНЕНИЙ НЕТ'
        }
        return array.map((item) => {
            return (
                <div key={array.indexOf(item)} className={styles.historyItem}>
                    <div className={styles.itemTitleWrap}>
                        <span className={styles.itemTitle}>
                            {`${item.actor ? item.actor : 'Кто-то'}, `}
                        </span>
                        <span className={styles.itemTitle}>
                            {formatDate(item.action_at)}
                        </span>
                        <span className={styles.itemAction}>
                            {`${returnCurrentStatusString(item.status)}`}
                        </span>
                        {renderHistoryLayout(item)}
                    </div>
                </div>
            );
        })
    }
    return (
        <div className={styles.historyWrap}>
            {renderHistory(data)}
        </div>
    );
}

{/* <div className={styles.historyItem}>
<div className={styles.itemTitleWrap}>
    <span className={styles.itemTitle}>Историк, 29 июня 08:15</span>
    <span className={styles.itemAction}>Изменил комментарий</span>
</div>
<div className={styles.itemDescrWrap}>
    <span className={styles.itemDrescrNormal}>“Приехала с сыном Иваном.</span>
    <span className={styles.itemDrescrOld}>ываыва</span>
    <span className={styles.itemDrescrNew}>Не пришла на работу 5 раз в течении недели и не предупреждала руководителя. По запросу руководителя заблокировал.”</span>
</div>
</div> */}

// function renderHistoryLayout(data: IData, isOldData: boolean) {
//     if (!data) return;
//     const keysArray = Object.keys(data);
//     return keysArray.map((item) => {
//         return (
//             <div key={keysArray.indexOf(item)} className={styles.itemDescrWrap}>
//                 <span className={styles.itemAction}>
//                     {`${returnCurrentField(item)}`}
//                 </span>
//                 <br />
//                 <span className={isOldData ? `${styles.itemDrescrOld}` : `${styles.itemDrescrNew}`}>
//                     {data[item]}
//                 </span>
//                 {isOldData ? ' ' : ''}
//             </div>
//         )
//     })
// }
