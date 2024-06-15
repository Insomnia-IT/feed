import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import type { GetListResponse } from '@pankod/refine-core';
import { useList } from '@pankod/refine-core';

import { NEW_API_URL } from '~/const';
import type {
    AccessRoleEntity,
    ColorTypeEntity,
    CustomFieldEntity,
    DirectionEntity,
    FeedTypeEntity,
    GroupBadgeEntity,
    KitchenEntity,
    StatusEntity,
    TransportEntity,
    VolEntity,
    VolunteerRoleEntity
} from '~/interfaces';
import { dataProvider } from '~/dataProvider';

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
    comment: string;
    direction_head_comment: string;
    kitchen: string;
    feed: string;
    feed_type: string;
    main_role: string;
    access_role: string;
    color_type: string;
    first_name: string;
    gender: string;
    last_name: string;
    name: string;
    phone: string;
    position: string;
    vegan: boolean;
    departure_transport: string;
    arrival_transport: string;
    status: string;
    departure_date: string;
    arrival_date: string;
    is_blocked: boolean;
    custom_field: string;
}

const localizedFieldNames = {
    comment: 'Комментарий',
    direction_head_comment: 'Комментарий руководителя локации',
    feed_type: 'Тип питания',
    main_role: 'Роль',
    access_role: 'Право доступа',
    kitchen: 'Кухня',
    color_type: 'Цвет бейджа',
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
    directions: 'Службы/локации',
    group_badge: 'Групповой бейдж',
    number: 'Номер бейджа',
    batch: 'Партия бейджа',
};

function returnCurrentField(fieldName: string): string {
    return localizedFieldNames[fieldName] ?? fieldName;
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

    const { data: kitchens } = useList<KitchenEntity>({
        resource: 'kitchens'
    });

    const { data: feedTypes } = useList<FeedTypeEntity>({
        resource: 'feed-types'
    });

    const { data: colors } = useList<ColorTypeEntity>({
        resource: 'colors'
    });

    const { data: accessRoles } = useList<AccessRoleEntity>({
        resource: 'access-roles'
    });

    const { data: volunteerRoles } = useList<VolunteerRoleEntity>({
        resource: 'volunteer-roles'
    });

    const { data: transports } = useList<TransportEntity>({
        resource: 'transports'
    });

    const { data: statuses } = useList<StatusEntity>({
        resource: 'statuses'
    });

    const { data: genders } = useList<AccessRoleEntity>({
        resource: 'genders'
    });

    const { data: directions } = useList<DirectionEntity>({
        resource: 'directions'
    });

    const { data: groupBadges } = useList<GroupBadgeEntity>({
        resource: 'group-badges'
    });

    const [customFields, setCustomFields] = useState<Array<CustomFieldEntity>>([]);

    const loadCustomFields = async () => {
        const { data } = await dataProvider.getList<CustomFieldEntity>({
            resource: 'volunteer-custom-fields'
        });

        setCustomFields(data);
    };

    useEffect(() => {
        void loadCustomFields();
    }, []);

    const kitchenNameById = useMapFromList(kitchens);
    const feedTypeNameById = useMapFromList(feedTypes);
    const colorNameById = useMapFromList(colors, 'description');
    const accessRoleById = useMapFromList(accessRoles);
    const volunteerRoleById = useMapFromList(volunteerRoles);
    const statusById = useMapFromList(statuses);
    const transportById = useMapFromList(transports);
    const genderById = useMapFromList(genders);
    const directionById = useMapFromList(directions);
    const groupBadgeById = useMapFromList(groupBadges);

    const historyData = async () => {
        const response: IHistoryData = await axios.get(`${NEW_API_URL}/history/?volunteer_uuid=${uuid}`);
        const result = response.data.results;
        const reversedResult = result.reverse();
        setData(reversedResult);
        console.log(reversedResult);
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
            timeZone: 'Europe/Moscow'
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

    function returnCorrectFieldValue(obj: IData, key: string) {
        if (!key) return;
        if (!obj) return;
        if (key === 'vegan') {
            return returnVeganFieldValue(obj[key]);
        } else if (key === 'is_blocked') {
            return returnisBlockedFieldValue(obj[key]);
        } else if (key === 'comment') {
            const result: string | undefined = obj[key];
            if (!result) return;
            return result.replace(/<\/?[^>]+(>|$)/g, '');
        } else if (key === 'kitchen') {
            return kitchenNameById[obj[key]];
        } else if (key === 'main_role') {
            return volunteerRoleById[obj[key]];
        } else if (key === 'access_role') {
            return accessRoleById[obj[key]];
        } else if (key === 'color_type') {
            return colorNameById[obj[key]];
        } else if (key === 'feed_type') {
            return feedTypeNameById[obj[key]];
        } else if (key === 'gender') {
            return genderById[obj[key]];
        } else if (key === 'status') {
            return genderById[obj[key]];
        } else if (key === 'group_badge') {
            return groupBadgeById[obj[key]];
        } else if (key === 'directions') {
            return obj[key].map((id) => directionById[id]).join(', ');
        } else if (key === 'arrival_transport' || key === 'departure_transport') {
            return transportById[obj[key]];
        } else if (key === 'custom_field') {
            return '';
        } else if (key === 'value') {
            if (obj[key] === 'true') {
                return 'Да';
            } else if (obj[key] === 'false') {
                return 'Нет';
            } else {
                return obj[key];
            }
        } else {
            return obj[key];
        }
    }

    function renderHistoryLayout(data: IResult) {
        if (!data) return;
        const keysArray = Object.keys(data.data);
        const keysToDelete = ['id', 'volunteer', 'badge', 'deleted', 'feed', 'role', 'custom_field'];
        const updatedKeysArray = keysArray.filter((key) => !keysToDelete.includes(key));
        return updatedKeysArray.map((item) => {
            function getCustomFieldName() {
                const idToFind = +data.data.custom_field;
                const foundObject = customFields.find((element) => element.id === idToFind);
                return foundObject?.name;
            }
            return (
                <div key={updatedKeysArray.indexOf(item)} className={styles.itemDescrWrap}>
                    <span className={styles.itemAction}>
                        {item === 'value' ? getCustomFieldName() : returnCurrentField(item)}
                    </span>
                    <br />
                    <span className={styles.itemDrescrOld}>{returnCorrectFieldValue(data.old_data, item) || ''}</span>
                    <span className={styles.itemDrescrNew}>{returnCorrectFieldValue(data.data, item) || '-'}</span>
                </div>
            );
        });
    }

    function getCorrectTitleEvent(typeInfo: string) {
        if (typeInfo === 'arrival') {
            return <span className={`${styles.itemAction} ${styles.itemActionModif}`}>{`информацию по заезду`}</span>;
        } else if (typeInfo === 'volunteer') {
            return (
                <span className={`${styles.itemAction} ${styles.itemActionModif}`}>{`информацию по волонтеру`}</span>
            );
        } else if (typeInfo === 'volunteercustomfieldvalue') {
            return (
                <span className={`${styles.itemAction} ${styles.itemActionModif}`}>
                    {`информацию по кастомному полю`}
                </span>
            );
        } else {
            <span className={`${styles.itemAction} ${styles.itemActionModif}`}>
                {`сообщите о баге, если видите это!`}
            </span>;
        }
    }

    const renderHistory = (array: Array<IResult> | undefined) => {
        if (array === undefined) {
            return 'ИЗМЕНЕНИЙ НЕТ';
        }
        return array.map((item) => {
            const getId = () => {
                if (!item.actor) return;
                if (item.actor.id) {
                    return item.actor.id;
                } else {
                    return;
                }
            };
            const id = getId();
            return (
                <div key={array.indexOf(item)} className={styles.historyItem}>
                    <div className={styles.itemTitleWrap}>
                        <span
                            className={`${styles.itemTitle} ${styles.itemTitleRoute}`}
                            onClick={
                                id
                                    ? () => {
                                          void handleRouteClick(id);
                                      }
                                    : undefined
                            }
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
