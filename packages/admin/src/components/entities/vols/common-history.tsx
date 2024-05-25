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
        results: [];
    };
}

export function CommonHistory() {
    const [uuid, setUuid] = useState('');
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
    };
    useEffect(() => {
        setNewUuid();
    }, []);
    useEffect(() => {
        historyData();
    }, [uuid]);
    return <div className={styles.historyWrap}>{uuid}</div>;
}
