import { useQuery } from '@tanstack/react-query';

// import axios from 'axios';
// import { NEW_API_URL } from 'const';
import type { FeedTransactionAnomaly } from 'interfaces';

const ANOMALIES_QUERY_KEY = 'feed-transaction-anomalies';

/** Мок-данные для модалки «Аномалии» до готовности бэкенда. Экспорт для fallback при 404. */
export function getMockAnomalies(_dtimeFrom: string, _dtimeTo: string): FeedTransactionAnomaly[] {
    return [
        {
            group_badge_name: 'Служба логистики',
            direction_name: 'Логистика',
            direction_amount: 10,
            calculated_amount: 8,
            real_amount: 12,
            problem: 'Перекорм службы'
        },
        {
            group_badge_name: 'Культурная служба',
            direction_name: 'Культура',
            direction_amount: 5,
            calculated_amount: null,
            real_amount: 3,
            problem: 'Бейдж не использовался на обед'
        },
        {
            group_badge_name: '',
            direction_name: 'Медицина',
            direction_amount: 7,
            calculated_amount: null,
            real_amount: 9,
            problem: 'Перекорм службы'
        },
        {
            group_badge_name: 'Детская служба',
            direction_name: 'Дети',
            direction_amount: 4,
            calculated_amount: 4,
            real_amount: 2,
            problem: 'Неверный план'
        }
    ];
}

/** Запрос аномалий за период. Пока с моком; при готовности бэка заменить на реальный GET. */
export function useAnomalies(dtimeFrom: string | undefined, dtimeTo: string | undefined) {
    const enabled = Boolean(dtimeFrom && dtimeTo);

    return useQuery({
        queryKey: [ANOMALIES_QUERY_KEY, dtimeFrom, dtimeTo],
        enabled,
        queryFn: async (): Promise<FeedTransactionAnomaly[]> => {
            // TODO: когда бэк готов — раскомментировать и убрать мок
            // const { data } = await axios.get<FeedTransactionAnomaly[]>(
            //     `${NEW_API_URL}/feed-transaction/anomalies/`,
            //     { params: { dtime_from: dtimeFrom, dtime_to: dtimeTo } }
            // );
            // return Array.isArray(data) ? data : [];
            if (!dtimeFrom || !dtimeTo) return [];
            return getMockAnomalies(dtimeFrom, dtimeTo);
        }
    });
}
