import axios from 'axios';
import { useApiUrl, useNotification } from '@refinedev/core';
import type { VolEntity } from 'interfaces';
import type { ChangeMassEditField, VolunteerField } from './mass-edit-types';

interface FieldItem {
    field: string;
    // Может быть пустым для сброса значения
    data: string | null;
}

function fillFieldItems({ fieldValue, fieldName, isCustom = false, isArrival = false }: VolunteerField): {
    commonFields?: FieldItem[];
    arrivalFields?: FieldItem[];
    customFields?: FieldItem[];
} {
    const fieldItem: FieldItem = {
        field: fieldName,
        data: fieldValue
    };

    const result: {
        commonFields?: FieldItem[];
        arrivalFields?: FieldItem[];
        customFields?: FieldItem[];
    } = {
        commonFields: [],
        arrivalFields: [],
        customFields: []
    };

    if (isCustom) {
        result.customFields = [fieldItem];

        return result;
    }

    if (isArrival) {
        result.arrivalFields = [fieldItem];

        return result;
    }

    result.commonFields = [fieldItem];

    return result;
}

export const useDoChange = ({
    vols,
    reloadVolunteers
}: {
    vols: VolEntity[];
    reloadVolunteers: () => Promise<void>;
}): ChangeMassEditField => {
    const apiUrl = useApiUrl();
    const { open = () => {} } = useNotification();

    return async (params: VolunteerField) => {
        const { commonFields, arrivalFields, customFields } = fillFieldItems(params);

        try {
            await axios.post(apiUrl + '/volunteer-group/', {
                volunteers_ids: vols.map((vol) => vol.id),
                field_list: commonFields,
                arrival_field_list: arrivalFields,
                custom_field_list: customFields
            });

            open({
                description: 'Изменения успешно применены',
                message: 'Список волонтеров сейчас обновится',
                type: 'success',
                undoableTimeout: 5000
            });

            await reloadVolunteers();
        } catch (error) {
            console.error('useDoChange error', error);

            open({
                message: 'Произошла ошибка. Возможно, изменения не были применены',
                type: 'error',
                undoableTimeout: 5000
            });
        }
    };
};
